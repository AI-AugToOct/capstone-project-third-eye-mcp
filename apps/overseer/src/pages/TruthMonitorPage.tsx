import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import SessionSelector from '../components/monitor/SessionSelector';
import OverviewTab from '../components/monitor/tabs/OverviewTab';
import EyesTab from '../components/monitor/tabs/EyesTab';
import EvidenceTab from '../components/monitor/tabs/EvidenceTab';
import OperationsTab from '../components/monitor/tabs/OperationsTab';
import DiagnosticsTab from '../components/monitor/tabs/DiagnosticsTab';
import LiveActivityFeed from '../components/LiveActivityFeed';
import MetricCard from '../components/MetricCard';
import WebSocketStatus from '../components/WebSocketStatus';
import { NotificationContainer, processEventNotification } from '../components/NotificationToast';
import { usePipelineWS } from '../hooks/usePipelineWS';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useSecureStorage } from '../hooks/useSecureStorage';
import { usePipelineStore } from '../store/pipelineStore';
import HeroRibbon from '../components/monitor/HeroRibbon';
import { fetchSessionSummary, updateSessionSettings, postResubmitRequest, fetchSessions } from '../lib/api';
import type {
  SessionSummary,
  SessionSettingsPayload,
  PipelineEvent,
  ClarificationContext,
  SessionOverview,
} from '../types/pipeline';
import EyeDrawer from '../components/EyeDrawer';
import WhyNotApprovedModal from '../components/WhyNotApprovedModal';
import { extractClarifications } from '../lib/clarifications';

const TABS = ['overview', 'eyes', 'evidence', 'operations', 'diagnostics'] as const;

type TabKey = (typeof TABS)[number];

const tabLabels: Record<TabKey, string> = {
  overview: 'Overview',
  eyes: 'Eyes',
  evidence: 'Evidence',
  operations: 'Operations',
  diagnostics: 'Diagnostics',
};

export function TruthMonitorPage() {
  const params = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [storedSession, setStoredSession] = useLocalStorage<string>('third-eye.session-id', '');
  const [storedKey, setStoredKey] = useSecureStorage<string>('api-key', '');
  const [noviceMode, setNoviceMode] = useLocalStorage<boolean>('third-eye.mode.novice', true);
  const [personaMode, setPersonaMode] = useLocalStorage<boolean>('third-eye.mode.persona', true);
  const [activeTab, setActiveTab] = useLocalStorage<TabKey>('third-eye.monitor.tab', 'overview');
  const [autoFollow, setAutoFollow] = useLocalStorage<boolean>('third-eye.monitor.auto-follow', true);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [selectedEye, setSelectedEye] = useState<string | null>(null);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | undefined>();
  const [whyEye, setWhyEye] = useState<string | null>(null);
  const [resubmitMessage, setResubmitMessage] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionOverview[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [sessionsRefreshTick, setSessionsRefreshTick] = useState(0);

  const sessionId = params.sessionId ?? storedSession;
  const apiKey = storedKey;

  const connected = usePipelineStore((state) => state.connected);
  const connectionAttempts = usePipelineStore((state) => state.connectionAttempts);
  const events = usePipelineStore((state) => state.events);
  const eyes = usePipelineStore((state) => state.eyes);
  const claims = usePipelineStore((state) => state.claims);
  const settings = usePipelineStore((state) => state.settings) ?? {};
  const setSettings = usePipelineStore((state) => state.setSettings);
  const pipelineError = usePipelineStore((state) => state.error);
  const pipelineSessionId = usePipelineStore((state) => state.sessionId);

  useEffect(() => {
    if (params.sessionId && params.sessionId !== storedSession) {
      setStoredSession(params.sessionId);
    }
  }, [params.sessionId, setStoredSession, storedSession]);

  usePipelineWS({ sessionId, apiKey, enable: Boolean(sessionId && apiKey) });

  useEffect(() => {
    if (!sessionId || !apiKey) {
      setSummary(null);
      return;
    }
    const controller = new AbortController();
    setSummaryLoading(true);
    fetchSessionSummary({ sessionId, apiKey, signal: controller.signal })
      .then((result) => {
        setSummary(result);
        setSummaryError(null);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error('Failed to load session summary', error);
        setSummaryError(error instanceof Error ? error.message : 'Failed to load session summary');
      })
      .finally(() => setSummaryLoading(false));
    return () => controller.abort();
  }, [sessionId, apiKey, events.length]);

  useEffect(() => {
    if (!apiKey) {
      setSessions([]);
      setSessionsError(null);
      setSessionsLoading(false);
      return;
    }

    const controller = new AbortController();
    setSessionsLoading(true);
    setSessionsError(null);
    fetchSessions({ apiKey, limit: 20, signal: controller.signal })
      .then((items) => {
        setSessions(items);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error('Failed to load sessions roster', error);
        setSessionsError(error instanceof Error ? error.message : 'Failed to load session roster');
        setSessions([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setSessionsLoading(false);
        }
      });

    return () => controller.abort();
  }, [apiKey, sessionsRefreshTick]);

  const heroMetrics = summary?.hero_metrics ?? null;
  const initialising = summaryLoading || (Boolean(sessionId && apiKey) && !connected && events.length === 0);

  const byakuganEvents = useMemo(() => events.filter((event) => event.eye === 'BYAKUGAN'), [events]);
  const latestPlanMd = useMemo(() => {
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const event = events[i];
      if (event.eye?.startsWith('RINNEGAN') && typeof event.data?.plan_md === 'string') {
        return event.data.plan_md as string;
      }
    }
    return undefined;
  }, [events]);
  const latestDraft = useMemo(() => {
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const event = events[i];
      const data = event.data ?? {};
      if (typeof data.draft_md === 'string') {
        return data.draft_md as string;
      }
      if (typeof data.plan_md === 'string') {
        return data.plan_md as string;
      }
    }
    return '';
  }, [events]);

  const clarifications = useMemo<ClarificationContext>(() => {
    return extractClarifications(eyes.SHARINGAN);
  }, [eyes]);

  const selectedEvent = selectedEventIndex !== undefined ? events[selectedEventIndex] ?? null : null;

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
  };

  const sessionCatalog = useMemo(() => {
    const map = new Map<string, SessionOverview>();
    sessions.forEach((item) => map.set(item.session_id, item));

    const ensure = (id: string | null) => {
      if (!id || map.has(id)) return;
      map.set(id, {
        session_id: id,
        title: id,
        status: 'in_progress',
        created_at: null,
        last_event_at: null,
        tenant: summary?.tenant ?? null,
        eye_counts: {
          approvals: summary?.hero_metrics?.approvals ?? 0,
          rejections: summary?.hero_metrics?.rejections ?? 0,
        },
      });
    };

    ensure(sessionId ?? null);
    ensure(pipelineSessionId ?? null);

    return Array.from(map.values());
  }, [sessions, sessionId, pipelineSessionId, summary]);

  useEffect(() => {
    if (sessionId) return;
    if (!sessionCatalog.length) return;
    const [first] = sessionCatalog;
    if (!first) return;
    setStoredSession(first.session_id);
    navigate(`/session/${encodeURIComponent(first.session_id)}`);
  }, [sessionCatalog, sessionId, setStoredSession, navigate]);

  const handleSessionChange = (nextSession: string) => {
    setStoredSession(nextSession);
    navigate(nextSession ? `/session/${encodeURIComponent(nextSession)}` : '/');
  };

  const handleSettingsSave = async (payload: SessionSettingsPayload) => {
    if (!sessionId || !apiKey) return;
    setSettingsSaving(true);
    try {
      const updated = await updateSessionSettings({ sessionId, apiKey, settings: payload });
      setSettings(updated);
    } catch (error) {
      console.error('Failed to update session settings', error);
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleSelectEvent = (index: number, event: PipelineEvent) => {
    setSelectedEventIndex(index);
    if (event.eye) {
      setSelectedEye(event.eye.toUpperCase());
    }
  };

  const handleClarificationsSubmitted = () => {
    setSelectedEventIndex(undefined);
  };

  const handleResubmit = async (eye: string | null) => {
    if (!eye || !sessionId || !apiKey) return;
    try {
      await postResubmitRequest({ sessionId, apiKey, eye });
      setResubmitMessage('Resubmission request recorded. Host agent will re-run the workflow.');
    } catch (error) {
      setResubmitMessage(error instanceof Error ? error.message : 'Failed to request resubmission.');
    }
  };

  const handleShowWhy = (eye: string) => {
    setWhyEye(eye);
    setResubmitMessage(null);
  };

  const refreshSessions = () => {
    setSessionsRefreshTick((prev) => prev + 1);
  };

  useEffect(() => {
    if (!autoFollow) return;
    if (!pipelineSessionId) return;
    if (pipelineSessionId === sessionId) return;
    setStoredSession(pipelineSessionId);
    navigate(`/session/${encodeURIComponent(pipelineSessionId)}`);
    setSessionsRefreshTick((prev) => prev + 1);
  }, [autoFollow, pipelineSessionId, sessionId, setStoredSession, navigate]);

  // Process events for notifications
  useEffect(() => {
    if (events.length === 0) return;
    const latestEvent = events[events.length - 1];
    if (latestEvent) {
      // Extract agent name from session context if available
      const agentName = summary?.tenant || 'Agent';
      processEventNotification(latestEvent, agentName);
    }
  }, [events, summary?.tenant]);

  // Calculate real-time metrics from actual data
  const realtimeMetrics = useMemo(() => {
    const totalValidations = events.filter(e => e.type === 'eye_update').length;
    const successfulValidations = events.filter(e => e.type === 'eye_update' && e.ok === true).length;
    const failedValidations = events.filter(e => e.type === 'eye_update' && e.ok === false).length;

    const successRate = totalValidations > 0 ? (successfulValidations / totalValidations) * 100 : 0;

    // Calculate average response time from events with timestamps
    const recentEvents = events.slice(-10).filter(e => e.ts);
    let avgResponseTime = 0;
    if (recentEvents.length > 1) {
      const timeDiffs = recentEvents.slice(1).map((event, i) => {
        const current = new Date(event.ts!).getTime();
        const previous = new Date(recentEvents[i].ts!).getTime();
        return current - previous;
      });
      avgResponseTime = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
    }

    return {
      totalValidations,
      successfulValidations,
      failedValidations,
      successRate,
      avgResponseTime: Math.round(avgResponseTime / 1000), // Convert to seconds
      activeEyes: Object.keys(eyes).filter(eye => eyes[eye]?.ok === null).length
    };
  }, [events, eyes]);

  // Get last event time for connection status
  const lastEventTime = useMemo(() => {
    if (events.length === 0) return undefined;
    const latestEvent = events[events.length - 1];
    return latestEvent?.ts ? new Date(latestEvent.ts) : undefined;
  }, [events]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 pb-12">
      <HeroRibbon
        sessionId={sessionId}
        apiKey={apiKey}
        connected={connected}
        connectionAttempts={connectionAttempts}
        metrics={heroMetrics}
        loading={summaryLoading}
        error={summaryError}
      />

      <SessionSelector
        sessionId={sessionId}
        apiKey={apiKey}
        onChangeSession={handleSessionChange}
        onApiKeyChange={setStoredKey}
        noviceMode={noviceMode}
        personaMode={personaMode}
        onNoviceToggle={setNoviceMode}
        onPersonaToggle={setPersonaMode}
        settings={settings}
        connected={connected}
        connectionAttempts={connectionAttempts}
        onSaveSettings={handleSettingsSave}
        settingsSaving={settingsSaving}
        sessions={sessionCatalog}
        sessionsLoading={sessionsLoading}
        sessionsError={sessionsError}
        onRefreshSessions={refreshSessions}
        autoFollow={autoFollow}
        onAutoFollowChange={setAutoFollow}
      />

      {/* WebSocket Status */}
      <WebSocketStatus
        connected={connected}
        connectionAttempts={connectionAttempts}
        lastEventTime={lastEventTime}
      />

      {/* Real-time Metrics Dashboard */}
      {sessionId && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Validations"
            value={realtimeMetrics.totalValidations}
            icon="🔍"
            description="Validations processed in this session"
            isLoading={summaryLoading}
          />
          <MetricCard
            title="Success Rate"
            value={realtimeMetrics.successRate.toFixed(1)}
            suffix="%"
            icon="✅"
            trend={realtimeMetrics.successRate > 80 ? 5 : realtimeMetrics.successRate > 60 ? 0 : -5}
            variant={realtimeMetrics.successRate > 80 ? 'success' : realtimeMetrics.successRate > 60 ? 'warning' : 'error'}
            description="Percentage of approved validations"
            isLoading={summaryLoading}
          />
          <MetricCard
            title="Active Eyes"
            value={realtimeMetrics.activeEyes}
            icon="👁️"
            description="Eyes currently processing"
            variant={realtimeMetrics.activeEyes > 0 ? 'warning' : 'default'}
            isLoading={summaryLoading}
          />
          <MetricCard
            title="Avg Response"
            value={realtimeMetrics.avgResponseTime}
            suffix="s"
            icon="⚡"
            description="Average validation time"
            variant={realtimeMetrics.avgResponseTime < 5 ? 'success' : realtimeMetrics.avgResponseTime < 15 ? 'warning' : 'error'}
            isLoading={summaryLoading}
          />
        </div>
      )}

      {/* Live Activity Feed and Error Display */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {pipelineError && (
            <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
              {pipelineError}
            </div>
          )}
          <LiveActivityFeed events={events} maxItems={8} />
        </div>
        <div className="space-y-4">
          {/* Additional metrics or info could go here */}
          {summary?.tenant && (
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
              <h3 className="text-sm font-medium text-blue-400 mb-2">Session Agent</h3>
              <p className="text-blue-300">{summary.tenant}</p>
              <p className="text-xs text-blue-400 mt-1">
                Currently validating your submissions
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-slate-300">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => handleTabChange(tab)}
            className={`rounded-full border px-4 py-2 transition ${activeTab === tab ? 'border-accent-primary text-accent-primary' : 'border-surface-outline/60 text-slate-400 hover:border-accent-primary hover:text-accent-primary'}`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </nav>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {activeTab === 'overview' && (
          <OverviewTab
            summary={summary}
            sessionId={sessionId}
            apiKey={apiKey}
            latestPlanMd={latestPlanMd}
            loading={initialising}
          />
        )}
        {activeTab === 'eyes' && (
          <EyesTab
            eyes={eyes}
            events={events}
            personaMode={personaMode}
            onOpenDetails={setSelectedEye}
            onShowWhy={handleShowWhy}
            selectedEventIndex={selectedEventIndex}
            onSelectEvent={handleSelectEvent}
            clarifications={clarifications}
            sessionId={sessionId}
            apiKey={apiKey}
            onClarificationsSubmitted={handleClarificationsSubmitted}
            loading={initialising}
          />
        )}
        {activeTab === 'evidence' && (
          <EvidenceTab
            claims={claims}
            events={events}
            latestDraft={latestDraft}
            byakuganEvents={byakuganEvents}
            noviceMode={noviceMode}
            loading={initialising}
          />
        )}
        {activeTab === 'operations' && (
          <OperationsTab
            sessionId={sessionId}
            apiKey={apiKey}
            latestDraft={latestDraft}
            latestEvent={selectedEvent}
            events={events}
            resubmitMessage={resubmitMessage}
            loading={initialising}
          />
        )}
        {activeTab === 'diagnostics' && (
          <DiagnosticsTab
            events={events}
            selectedEvent={selectedEvent}
            sessionId={sessionId}
            apiKey={apiKey}
            summary={summary}
            connected={connected}
            connectionAttempts={connectionAttempts}
            loading={initialising}
          />
        )}
      </motion.div>

      <EyeDrawer
        isOpen={Boolean(selectedEye)}
        onClose={() => setSelectedEye(null)}
        state={selectedEye ? eyes[selectedEye] ?? null : null}
        noviceMode={noviceMode}
        personaMode={personaMode}
      />

      <WhyNotApprovedModal
        eyeState={whyEye ? eyes[whyEye] ?? null : null}
        open={Boolean(whyEye)}
        onClose={() => {
          setWhyEye(null);
          setResubmitMessage(null);
        }}
        onResubmit={() => handleResubmit(whyEye)}
      />

      {/* Toast Notifications */}
      <NotificationContainer />
    </div>
  );
}

export default TruthMonitorPage;
