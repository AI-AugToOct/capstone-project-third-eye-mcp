"""
Circuit breaker pattern for LLM calls with graceful degradation.

Protects against cascading failures when LLM services are unavailable
or degraded. Provides fallback mechanisms and automatic recovery.
"""
from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Awaitable, Callable, Dict

from ._recoverable_error import LLMCircuitBreakerError, LLMTimeoutError

LOG = logging.getLogger(__name__)


class CircuitState(str, Enum):
    """Circuit breaker states."""

    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Blocking requests
    HALF_OPEN = "half_open"  # Testing recovery


@dataclass
class CircuitBreakerConfig:
    """Configuration for circuit breaker."""

    failure_threshold: int = 5  # Failures before opening
    success_threshold: int = 2  # Successes to close from half-open
    timeout_seconds: float = 30.0  # Request timeout
    reset_timeout_seconds: int = 60  # Time before trying half-open
    half_open_max_requests: int = 1  # Max concurrent requests in half-open


@dataclass
class CircuitMetrics:
    """Metrics for a circuit breaker."""

    failure_count: int = 0
    success_count: int = 0
    last_failure_time: float | None = None
    last_success_time: float | None = None
    total_requests: int = 0
    total_failures: int = 0
    total_successes: int = 0


class CircuitBreaker:
    """
    Circuit breaker for protecting LLM calls.

    States:
    - CLOSED: Normal operation, tracking failures
    - OPEN: Blocking all requests, returning errors immediately
    - HALF_OPEN: Allowing limited requests to test recovery
    """

    def __init__(self, name: str, config: CircuitBreakerConfig | None = None):
        self.name = name
        self.config = config or CircuitBreakerConfig()
        self.state = CircuitState.CLOSED
        self.metrics = CircuitMetrics()
        self._state_change_time = time.time()
        self._half_open_requests = 0
        self._lock = asyncio.Lock()

    async def call(
        self,
        func: Callable[..., Awaitable[Any]],
        *args: Any,
        **kwargs: Any,
    ) -> Any:
        """
        Execute function with circuit breaker protection.

        Args:
            func: Async function to call
            *args, **kwargs: Function arguments

        Returns:
            Function result

        Raises:
            LLMCircuitBreakerError: If circuit is open
            LLMTimeoutError: If call times out
            Exception: Original exception if call fails
        """
        async with self._lock:
            self.metrics.total_requests += 1

            # Check circuit state
            if self.state == CircuitState.OPEN:
                # Check if we should transition to half-open
                if self._should_attempt_reset():
                    LOG.info(f"Circuit {self.name}: Transitioning to HALF_OPEN")
                    self.state = CircuitState.HALF_OPEN
                    self._state_change_time = time.time()
                    self._half_open_requests = 0
                else:
                    # Still open, reject request
                    retry_after = int(
                        self.config.reset_timeout_seconds
                        - (time.time() - self._state_change_time)
                    )
                    raise LLMCircuitBreakerError(self.name, retry_after)

            elif self.state == CircuitState.HALF_OPEN:
                # Limit concurrent requests in half-open state
                if self._half_open_requests >= self.config.half_open_max_requests:
                    raise LLMCircuitBreakerError(self.name, 5)
                self._half_open_requests += 1

        # Execute function with timeout
        try:
            result = await asyncio.wait_for(
                func(*args, **kwargs), timeout=self.config.timeout_seconds
            )

            # Success
            async with self._lock:
                self._on_success()

            return result

        except asyncio.TimeoutError as e:
            async with self._lock:
                self._on_failure()
            raise LLMTimeoutError(int(self.config.timeout_seconds)) from e

        except Exception as e:
            async with self._lock:
                self._on_failure()
            raise

        finally:
            if self.state == CircuitState.HALF_OPEN:
                async with self._lock:
                    self._half_open_requests -= 1

    def _on_success(self) -> None:
        """Handle successful call."""
        self.metrics.success_count += 1
        self.metrics.total_successes += 1
        self.metrics.last_success_time = time.time()

        if self.state == CircuitState.HALF_OPEN:
            # Check if we should close circuit
            if self.metrics.success_count >= self.config.success_threshold:
                LOG.info(
                    f"Circuit {self.name}: Transitioning to CLOSED "
                    f"(success threshold reached)"
                )
                self.state = CircuitState.CLOSED
                self._state_change_time = time.time()
                self.metrics.failure_count = 0
                self.metrics.success_count = 0

        elif self.state == CircuitState.CLOSED:
            # Reset failure count on success
            self.metrics.failure_count = 0

    def _on_failure(self) -> None:
        """Handle failed call."""
        self.metrics.failure_count += 1
        self.metrics.total_failures += 1
        self.metrics.last_failure_time = time.time()

        if self.state == CircuitState.HALF_OPEN:
            # Any failure in half-open reopens circuit
            LOG.warning(f"Circuit {self.name}: Reopening (failure in HALF_OPEN)")
            self.state = CircuitState.OPEN
            self._state_change_time = time.time()
            self.metrics.success_count = 0

        elif self.state == CircuitState.CLOSED:
            # Check if we should open circuit
            if self.metrics.failure_count >= self.config.failure_threshold:
                LOG.warning(
                    f"Circuit {self.name}: Opening "
                    f"(failure threshold {self.config.failure_threshold} reached)"
                )
                self.state = CircuitState.OPEN
                self._state_change_time = time.time()
                self.metrics.success_count = 0

    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to try half-open."""
        elapsed = time.time() - self._state_change_time
        return elapsed >= self.config.reset_timeout_seconds

    def get_status(self) -> Dict[str, Any]:
        """Get current circuit breaker status."""
        return {
            "name": self.name,
            "state": self.state.value,
            "metrics": {
                "failure_count": self.metrics.failure_count,
                "success_count": self.metrics.success_count,
                "total_requests": self.metrics.total_requests,
                "total_failures": self.metrics.total_failures,
                "total_successes": self.metrics.total_successes,
                "last_failure_time": self.metrics.last_failure_time,
                "last_success_time": self.metrics.last_success_time,
            },
            "state_duration_seconds": time.time() - self._state_change_time,
        }


class CircuitBreakerRegistry:
    """Registry for managing multiple circuit breakers."""

    def __init__(self):
        self._breakers: Dict[str, CircuitBreaker] = {}

    def get_or_create(
        self, name: str, config: CircuitBreakerConfig | None = None
    ) -> CircuitBreaker:
        """Get existing circuit breaker or create new one."""
        if name not in self._breakers:
            self._breakers[name] = CircuitBreaker(name, config)
            LOG.info(f"Created circuit breaker: {name}")
        return self._breakers[name]

    def get_status_all(self) -> Dict[str, Any]:
        """Get status of all circuit breakers."""
        return {name: breaker.get_status() for name, breaker in self._breakers.items()}


# Global registry
CIRCUIT_BREAKER_REGISTRY = CircuitBreakerRegistry()


def get_circuit_breaker(name: str, config: CircuitBreakerConfig | None = None) -> CircuitBreaker:
    """Get circuit breaker from global registry."""
    return CIRCUIT_BREAKER_REGISTRY.get_or_create(name, config)
