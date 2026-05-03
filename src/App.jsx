import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, Activity, Play, Cpu, ChevronRight, ShieldAlert, TrendingDown,
  TrendingUp, ArrowDownRight, Briefcase, Zap, Target, Shield,
  AlertTriangle, CheckCircle, Info
} from 'lucide-react';

// ─── Animated Counter ─────────────────────────────────────────────────────────
const AnimatedNumber = ({ value, prefix = '', suffix = '', duration = 1000, style = {} }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, duration]);
  return <span style={style}>{prefix}{display.toLocaleString('en-IN')}{suffix}</span>;
};

// ─── Animated Arc ─────────────────────────────────────────────────────────────
const AnimatedArc = ({ progress, color, strokeWidth = 8, size = 200 }) => {
  const [p, setP] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / 900, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setP(eased * progress);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [progress]);
  return (
    <svg viewBox="0 0 100 50" style={{ width: size, height: size / 2 }}>
      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#E5E7EB" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={`${p * 125.6} 125.6`} />
    </svg>
  );
};

// ─── PULSE TAB ────────────────────────────────────────────────────────────────
const PulseTab = ({ userName }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [detailedCategories, setDetailedCategories] = useState([]);
  const GREEN = '#1A4731';
  const GREEN_TINT = '#D1FAE5';
  const AMBER = '#D97706';
  const AMBER_TINT = '#FFFBEB';

  useEffect(() => {
    fetch('/api/pulse')
      .then(res => res.json())
      .then(data => setDetailedCategories(data.detailedCategories))
      .catch(err => console.error("Error fetching pulse data:", err));
  }, []);

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <header style={{ padding: '28px 24px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Good evening, {userName}</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Today's Pulse</h1>
        </div>
        <div style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', background: '#fff', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <Bell size={18} color="#6B7280" />
          <span style={{ position: 'absolute', top: 9, right: 9, width: 7, height: 7, background: GREEN, borderRadius: '50%', border: '2px solid #fff' }} />
        </div>
      </header>

      {/* Safe to Spend Hero */}
      <div style={{ padding: '16px 24px' }}>
        <div style={{ background: GREEN_TINT, borderRadius: 24, padding: '28px 24px', textAlign: 'center', border: `1px solid ${GREEN}22`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: `${GREEN}08` }} />
          <p style={{ fontSize: 12, fontWeight: 600, color: GREEN, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Safe to spend today</p>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: GREEN }}>₹</span>
            <AnimatedNumber value={230} duration={900} style={{ fontSize: 64, fontWeight: 800, color: GREEN, letterSpacing: '-0.04em', lineHeight: 1 }} />
          </div>
          <p style={{ fontSize: 13, color: `${GREEN}99`, marginTop: 8, fontWeight: 500 }}>₹14,200 available this month</p>

          {/* Spend velocity bar */}
          <div style={{ marginTop: 20, background: `${GREEN}20`, borderRadius: 8, height: 6, overflow: 'hidden' }}>
            <div style={{ width: '94%', height: '100%', background: GREEN, borderRadius: 8, animation: 'growBar 1s ease' }} />
          </div>
          <p style={{ fontSize: 11, color: `${GREEN}88`, marginTop: 6, fontWeight: 500 }}>11:42 PM · 94% of day elapsed</p>
        </div>
      </div>

      {/* Why exactly breakdown */}
      <div style={{ padding: '0 24px 4px' }}>
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          style={{ width: '100%', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Why exactly ₹230?</span>
          <ChevronRight size={16} color="#9CA3AF" style={{ transform: showBreakdown ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </button>

        {showBreakdown && (
          <div style={{ background: '#fff', borderRadius: '0 0 16px 16px', border: '1px solid #E5E7EB', borderTop: 'none', padding: '0 20px 20px', animation: 'fadeDown 0.2s ease' }}>
            <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 16 }}>
              {/* Phase 1 */}
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Step 1 — Monthly Available</p>
              {[
                { label: 'Current Balance', value: '₹28,500', color: '#111827', indent: false },
                { label: 'Fixed Expenses (Rent, EMI)', value: '− ₹5,000', color: '#DC2626', indent: true },
                { label: 'Upcoming Subscriptions', value: '− ₹1,200', color: '#DC2626', indent: true },
                { label: 'Emergency Buffer', value: '− ₹2,000', color: '#D97706', indent: true },
                { label: 'Goal: Goa Trip', value: '− ₹6,100', color: '#D97706', indent: true },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderLeft: row.indent ? `3px solid ${row.color}22` : 'none', paddingLeft: row.indent ? 12 : 0 }}>
                  <span style={{ fontSize: 13, color: row.indent ? '#6B7280' : '#111827', fontWeight: row.indent ? 400 : 600 }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: row.color, fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px dashed #E5E7EB', marginTop: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Available for Month</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: GREEN, fontVariantNumeric: 'tabular-nums' }}>₹14,200</span>
              </div>
              {/* Phase 2 */}
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 12, marginBottom: 10 }}>Step 2 — Daily Limit</p>
              {[
                { label: 'Days to Salary', value: '12 remaining', color: '#111827', indent: false },
                { label: 'Base Daily Limit', value: '₹1,183', color: '#6B7280', indent: true },
                { label: 'Weekend AI Adjustment', value: '− ₹953', color: '#DC2626', indent: true },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderLeft: row.indent ? '3px solid #E5E7EB' : 'none', paddingLeft: row.indent ? 12 : 0 }}>
                  <span style={{ fontSize: 13, color: row.indent ? '#6B7280' : '#111827', fontWeight: row.indent ? 400 : 600 }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: row.color, fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: GREEN_TINT, borderRadius: 10, marginTop: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: GREEN }}>Safe Today</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: GREEN, fontVariantNumeric: 'tabular-nums' }}>₹230</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Money Flow */}
      <div style={{ padding: '20px 24px 0' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Money Flow</p>
        <div style={{ display: 'flex', gap: 12, height: 180, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 36, background: 'linear-gradient(180deg, #F9FAFB 0%, transparent 100%)', zIndex: 1 }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 36, background: 'linear-gradient(0deg, #F9FAFB 0%, transparent 100%)', zIndex: 1 }} />

          {/* IN column */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>IN</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, animation: 'tickerUp 20s linear infinite' }}>
              {[...Array(3)].flatMap((_, i) => [
                <div key={`salary-${i}`} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 100, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ background: '#EEF2FF', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Briefcase size={11} color="#4338CA" /></div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#374151', flex: 1 }}>Salary</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: GREEN, fontVariantNumeric: 'tabular-nums' }}>₹45k</span>
                </div>,
                <div key={`refund-${i}`} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 100, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ background: '#FEF9C3', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ArrowDownRight size={11} color="#CA8A04" /></div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#374151', flex: 1 }}>Refund</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: GREEN, fontVariantNumeric: 'tabular-nums' }}>₹1,200</span>
                </div>,
                <div key={`gap-${i}`} style={{ height: 48 }} />
              ])}
            </div>
          </div>

          {/* OUT column */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>OUT</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, animation: 'tickerUp 25s linear infinite reverse' }}>
              {[...Array(3)].flatMap((_, i) => [
                <Chip key={`food-${i}`} emoji="🍔" label="Food" amount="₹340" />,
                <Chip key={`uber-${i}`} emoji="🚗" label="Uber" amount="₹243" />,
                <Chip key={`cafe-${i}`} emoji="☕" label="Coffee" amount="₹180" />,
                <div key={`gap2-${i}`} style={{ height: 24 }} />
              ])}
            </div>
          </div>
        </div>
      </div>

      {/* Category Accordions */}
      <div style={{ padding: '20px 24px 120px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Spend Specifics</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {detailedCategories.map((cat, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <button
                onClick={() => setExpandedCategory(expandedCategory === i ? null : i)}
                style={{ width: '100%', background: 'transparent', border: 'none', padding: '16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: cat.warning ? AMBER_TINT : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{cat.emoji}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{cat.name}</p>
                  <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2, overflow: 'hidden', marginTop: 6, width: '80%' }}>
                    <div style={{ width: `${cat.pct}%`, height: '100%', background: cat.warning ? AMBER : GREEN, borderRadius: 2 }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>₹{cat.amount.toLocaleString('en-IN')}</p>
                  {cat.warning && <p style={{ fontSize: 10, color: AMBER, fontWeight: 600, marginTop: 2 }}>High</p>}
                </div>
                <ChevronRight size={18} color="#9CA3AF" style={{ transform: expandedCategory === i ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', marginLeft: 4 }} />
              </button>
              
              {expandedCategory === i && (
                <div style={{ padding: '0 16px 16px', background: '#F9FAFB', borderTop: '1px solid #E5E7EB', animation: 'fadeDown 0.2s ease' }}>
                  <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {cat.shops.map((shop, j) => (
                      <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{shop.name}</p>
                          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{shop.date}</p>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>₹{shop.amount.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Chip = ({ emoji, label, amount }) => (
  <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 100, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ fontSize: 14 }}>{emoji}</span>
    <span style={{ fontSize: 12, fontWeight: 500, color: '#374151', flex: 1 }}>{label}</span>
    <span style={{ fontSize: 12, fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>{amount}</span>
  </div>
);

// ─── COACH TAB ────────────────────────────────────────────────────────────────
const CoachTab = ({ userName }) => {
  const AMBER = '#B45309';
  const AMBER_TINT = '#FFFBEB';
  const GREEN = '#1A4731';

  const [coachData, setCoachData] = useState({
    healthScore: 0,
    opps: [],
    taxOpps: [],
    selfCompare: []
  });

  const [actingOn, setActingOn] = useState(null);
  const [completedOpps, setCompletedOpps] = useState({});

  useEffect(() => {
    fetch('/api/coach')
      .then(res => res.json())
      .then(data => setCoachData(data))
      .catch(err => console.error("Error fetching coach data:", err));
  }, []);

  const handleAct = (index) => {
    setActingOn(index);
    setTimeout(() => {
      setActingOn(null);
      setCompletedOpps(prev => ({ ...prev, [index]: true }));
    }, 800);
  };

  const { healthScore, opps, taxOpps, selfCompare } = coachData;

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <header style={{ padding: '28px 24px 16px' }}>
        <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Good evening, {userName}</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Your Coach</h1>
      </header>

      {/* Health Score (Moved to top) */}
      <div style={{ padding: '0 24px 24px', textAlign: 'center' }}>
        <div style={{ position: 'relative', width: 160, height: 80, margin: '0 auto 16px' }}>
          <AnimatedArc progress={healthScore / 100} color={AMBER} strokeWidth={8} size={160} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center' }}>
            <span style={{ fontSize: 38, fontWeight: 800, color: AMBER, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{healthScore}</span>
            <span style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 500 }}>/100</span>
          </div>
        </div>
        <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>Financial Health Score · 3 factors dragging you down</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {[
            { icon: <ShieldAlert size={14} color="#DC2626" />, bg: '#FEF2F2', label: 'Sub leaks' },
            { icon: <Activity size={14} color="#D97706" />, bg: '#FFFBEB', label: 'Food spike' },
            { icon: <TrendingDown size={14} color="#D97706" />, bg: '#FFFBEB', label: 'Low savings' },
          ].map((item, i) => (
            <div key={i} style={{ background: item.bg, borderRadius: 12, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              {item.icon}
              <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Coach Insight with merged Savings Opportunities */}
      <div style={{ padding: '0 24px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Actionable Insights</p>
        <div style={{ background: AMBER_TINT, borderRadius: 20, padding: 20, border: `1px solid ${AMBER}22` }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, #F59E0B, ${AMBER})`, flexShrink: 0, boxShadow: `0 4px 12px ${AMBER}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 18 }}>🎯</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#92400E', fontWeight: 400 }}>
                Your food spend this week is <strong style={{ fontWeight: 700 }}>₹1,840</strong>. Cook twice more and save ₹600 — that's your Goa trip in <strong style={{ fontWeight: 700 }}>10 days</strong>.
              </p>
              
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px dashed ${AMBER}40` }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#92400E', marginBottom: 10 }}>Quick Wins:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {opps.map((opp, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontSize: 18, flexShrink: 0 }}>{opp.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#92400E' }}>{opp.title}</p>
                        <p style={{ fontSize: 11, color: '#B45309' }}>Save {opp.save}</p>
                      </div>
                      <button 
                        onClick={() => handleAct(i)}
                        disabled={actingOn === i || completedOpps[i]}
                        style={{ background: completedOpps[i] ? '#16A34A' : AMBER, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: (actingOn === i || completedOpps[i]) ? 'default' : 'pointer', transition: 'background 0.3s', opacity: actingOn === i ? 0.7 : 1 }}
                      >
                        {actingOn === i ? '⏳...' : completedOpps[i] ? '✓ Done' : 'Act'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Optimization */}
      <div style={{ padding: '24px 24px 0' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Tax Optimization</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {taxOpps.map((opp, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{opp.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{opp.title}</p>
                <p style={{ fontSize: 11, color: '#9CA3AF' }}>{opp.desc}</p>
                <p style={{ fontSize: 12, marginTop: 4 }}><span style={{ fontWeight: 700, color: GREEN }}>{opp.save}</span></p>
              </div>
              <ChevronRight size={14} color="#D1D5DB" />
            </div>
          ))}
        </div>
      </div>

      {/* Compare Against Yourself */}
      <div style={{ padding: '24px 24px 120px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>vs Your Past 30 Days</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {selfCompare.map((b, i) => {
            const max = Math.max(b.current, b.past);
            const curPct = (b.current / max) * 100;
            const pastPct = (b.past / max) * 100;
            const diff = Math.abs(b.current - b.past);
            const diffStr = `₹${diff.toLocaleString('en-IN')} ${b.better ? 'less' : 'more'}`;
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{b.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: b.better ? '#1A4731' : '#DC2626' }}>{diffStr}</span>
                </div>
                <div style={{ position: 'relative', height: 24, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ height: 8, width: `${curPct}%`, background: AMBER, borderRadius: 4, animation: 'growBar 1s ease' }} />
                    <span style={{ fontSize: 10, color: '#6B7280', fontVariantNumeric: 'tabular-nums' }}>₹{(b.current/1000).toFixed(1)}k</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ height: 8, width: `${pastPct}%`, background: '#E5E7EB', borderRadius: 4, animation: 'growBar 1s ease' }} />
                    <span style={{ fontSize: 10, color: '#9CA3AF', fontVariantNumeric: 'tabular-nums' }}>₹{(b.past/1000).toFixed(1)}k</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── ENGINE TAB ───────────────────────────────────────────────────────────────
const EngineTab = ({ userName }) => {
  const INDIGO = '#4338CA';
  const INDIGO_TINT = '#EEF2FF';
  const GREEN = '#1A4731';
  const tickerItems = ['Uber ₹243 → +₹7 swept', 'Swiggy ₹180 → +₹20 saved', 'Coffee ₹90 → +₹10 invested', 'Zomato ₹320 → +₹30 swept'];

  const [engineData, setEngineData] = useState(null);
  const [isSweeping, setIsSweeping] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [simAmount, setSimAmount] = useState('');
  const [simShop, setSimShop] = useState('');

  const fetchEngineData = () => {
    fetch('/api/engine')
      .then(res => res.json())
      .then(data => setEngineData(data))
      .catch(err => console.error("Error fetching engine data:", err));
  };

  useEffect(() => {
    fetchEngineData();
  }, []);

  if (!engineData) return <div style={{ padding: 24 }}>Loading Engine...</div>;

  const handleSimulateSync = async () => {
    if (!simAmount || !simShop) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/webhook/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1, amount: Number(simAmount), shopName: simShop })
      });
      const data = await res.json();
      setSyncResult(data.transaction);
      fetchEngineData(); // Refresh engine data (portfolio might have changed if we hooked it up, but for now just refreshing)
      // Clear inputs
      setSimAmount('');
      setSimShop('');
    } catch (e) {
      console.error("Sync failed", e);
    }
    setIsSyncing(false);
    
    // Hide success after 3s
    setTimeout(() => setSyncResult(null), 3000);
  };

  const handleSimulateSweep = async () => {
    setIsSweeping(true);
    try {
      await fetch('/api/cron/engine-sweep', { method: 'POST' });
      fetchEngineData(); // Refresh portfolio and ticker
    } catch (e) {
      console.error("Sweep failed", e);
    }
    setIsSweeping(false);
  };

  const rules = engineData.rules.map(r => ({
    ...r,
    icon: r.icon === 'Zap' ? <Zap size={15} color={INDIGO} /> :
          r.icon === 'Target' ? <Target size={15} color={INDIGO} /> :
          <Shield size={15} color={INDIGO} />
  }));

  const tickerData = engineData.sweeps && engineData.sweeps.length > 0 ? engineData.sweeps : tickerItems;
  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <header style={{ padding: '28px 24px 16px' }}>
        <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Good evening, {userName}</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Your Money Engine</h1>
      </header>

      {/* Engine Status */}
      <div style={{ padding: '0 24px' }}>
        <div style={{ background: `linear-gradient(160deg, #312E81 0%, ${INDIGO} 100%)`, borderRadius: 24, padding: '32px 24px 0', color: '#fff', textAlign: 'center', overflow: 'hidden' }}>
          <div style={{ position: 'relative', width: 48, height: 48, margin: '0 auto 16px' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', animation: 'pulse 3s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={18} color="#fff" />
            </div>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em', marginBottom: 6 }}>Engine Active</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 20 }}>3 rules running · Last sweep: 4 min ago</p>

          <div style={{ background: 'rgba(0,0,0,0.25)', margin: '0 -24px', padding: '12px 0', overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 32, animation: 'tickerLeft 18s linear infinite', whiteSpace: 'nowrap', width: 'max-content' }}>
              {[...tickerData, ...tickerData, ...tickerData].map((item, i) => (
                <span key={i} style={{ fontSize: 12, fontWeight: 500 }}>
                  {item.split('→')[0]}
                  <span style={{ color: '#4ADE80' }}>→{item.split('→')[1]}</span>
                  <span style={{ marginLeft: 24, color: 'rgba(255,255,255,0.3)' }}>·</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rules */}
      <div style={{ padding: '24px 24px 0' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>What The Engine Is Doing</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rules.map((rule, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #E5E7EB', borderLeft: `3px solid ${INDIGO}`, borderRadius: 16, padding: '16px 16px 16px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: INDIGO_TINT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{rule.icon}</div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{rule.name}</span>
                </div>
                {/* Toggle */}
                <div style={{ width: 36, height: 20, background: INDIGO, borderRadius: 10, position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 16, height: 16, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, right: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 8, paddingLeft: 38, lineHeight: 1.5 }}>{rule.desc}</p>
              <p style={{ fontSize: 11, color: '#9CA3AF', paddingLeft: 38 }}>Saved this month: <span style={{ fontWeight: 700, color: INDIGO, fontVariantNumeric: 'tabular-nums' }}>{rule.saved}</span></p>
            </div>
          ))}
          <button style={{ width: '100%', padding: '12px', background: 'transparent', border: `1px dashed ${INDIGO}55`, color: INDIGO, borderRadius: 100, fontWeight: 600, fontSize: 13, cursor: 'pointer', marginTop: 4 }}>+ Add Rule</button>
        </div>
      </div>

      {/* Portfolio Snapshot */}
      <div style={{ padding: '24px 24px 24px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Portfolio Snapshot</p>
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          {/* Area chart */}
          <div style={{ height: 72, marginBottom: 16 }}>
            <svg viewBox="0 0 300 60" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={INDIGO} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={INDIGO} stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path d="M0,60 L0,52 L50,48 L100,55 L150,40 L200,28 L250,18 L300,8 L300,60 Z" fill="url(#ig)" />
              <path d="M0,52 L50,48 L100,55 L150,40 L200,28 L250,18 L300,8" fill="none" stroke={INDIGO} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="300" cy="8" r="3" fill={INDIGO} />
            </svg>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginBottom: 2 }}>Total Invested</p>
              <AnimatedNumber value={engineData.portfolio?.totalInvested || 0} prefix="₹" duration={1200} style={{ fontSize: 26, fontWeight: 800, color: INDIGO, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginBottom: 2 }}>Returns</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#16A34A', fontVariantNumeric: 'tabular-nums' }}>+₹{engineData.portfolio?.returns || 0}</span>
                <span style={{ background: '#D1FAE5', color: '#16A34A', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>+{engineData.portfolio?.returnsPct || 0}%</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={13} color="#16A34A" />
              <p style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.5 }}>Auto-invested into Nifty 50 Index Fund · SEBI regulated</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Aggregator Sandbox */}
      <div style={{ padding: '0 24px 120px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Developer Sandbox: Simulate Bank Sync</p>
        <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: 20, padding: '20px', color: '#fff', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16, lineHeight: 1.5 }}>
            Paste a raw UPI transaction below. Our backend will use the <strong style={{color:'#fff'}}>MerchantMap</strong> or LLM fallback to categorize it automatically.
          </p>
          
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <input 
              type="number" 
              placeholder="Amount (₹)" 
              value={simAmount}
              onChange={e => setSimAmount(e.target.value)}
              style={{ width: '35%', padding: '12px 14px', background: '#1F2937', border: '1px solid #374151', borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none' }}
            />
            <input 
              type="text" 
              placeholder="e.g. UPI/1234/ZOMATO" 
              value={simShop}
              onChange={e => setSimShop(e.target.value)}
              style={{ flex: 1, padding: '12px 14px', background: '#1F2937', border: '1px solid #374151', borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none' }}
            />
          </div>
          
          <button 
            onClick={handleSimulateSync}
            disabled={isSyncing || !simAmount || !simShop}
            style={{ width: '100%', padding: '14px', background: INDIGO, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: isSyncing ? 'not-allowed' : 'pointer', opacity: (!simAmount || !simShop) ? 0.5 : 1 }}
          >
            {isSyncing ? 'Syncing with Bank API...' : 'Simulate Incoming Transaction'}
          </button>

          {syncResult && (
            <div style={{ marginTop: 16, padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px dashed #10B981', borderRadius: 12, animation: 'fadeDown 0.3s ease' }}>
              <p style={{ fontSize: 12, color: '#10B981', fontWeight: 600, marginBottom: 4 }}>✓ Sync Successful & Categorized</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14 }}>{syncResult.shopName}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16 }}>{syncResult.category?.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{syncResult.category?.name}</span>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #374151' }}>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 12, lineHeight: 1.5 }}>
              Test the Nightly Sweep! The Engine checks your daily transactions, rounds them up, and auto-invests the difference.
            </p>
            <button 
              onClick={handleSimulateSweep}
              disabled={isSweeping}
              style={{ width: '100%', padding: '14px', background: 'transparent', border: `1px dashed #10B981`, color: '#10B981', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: isSweeping ? 'wait' : 'pointer' }}
            >
              {isSweeping ? 'Sweeping...' : 'Trigger Nightly Engine Sweep'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
const LoginScreen = ({ onLogin }) => {
  const [name, setName] = useState('');
  const GREEN = '#1A4731';

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#FAFAFA', color: '#111827', padding: 24, animation: 'fadeUp 0.5s ease' }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Zap size={32} color={GREEN} />
      </div>
      <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 8, textAlign: 'center', color: '#111827' }}>Welcome to Finotsa</h1>
      <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 40, textAlign: 'center' }}>Your intelligent financial operating system.</p>
      
      <div style={{ width: '100%', maxWidth: 320 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>What should we call you?</p>
        <input 
          type="text" 
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="First Name"
          style={{ width: '100%', padding: '16px 20px', fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', borderRadius: 16, border: '1px solid #E5E7EB', background: '#fff', color: '#111827', outline: 'none', marginBottom: 24, boxSizing: 'border-box', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
          autoFocus
        />
        <button 
          onClick={() => { if (name.trim()) onLogin(name.trim()); }}
          disabled={!name.trim()}
          style={{ width: '100%', padding: 16, borderRadius: 16, background: name.trim() ? GREEN : '#E5E7EB', color: name.trim() ? '#fff' : '#9CA3AF', border: 'none', fontSize: 16, fontWeight: 700, cursor: name.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.3s', boxShadow: name.trim() ? '0 4px 12px rgba(26, 71, 49, 0.2)' : 'none' }}
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  );
};

// ─── APP SHELL ────────────────────────────────────────────────────────────────
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [tab, setTab] = useState('home');
  
  const tabs = [
    { id: 'home', icon: Activity, label: 'Pulse', accent: '#1A4731' },
    { id: 'coach', icon: Target, label: 'Coach', accent: '#B45309' },
    { id: 'engine', icon: Cpu, label: 'Engine', accent: '#4338CA' },
  ];

  if (!isLoggedIn) {
    return <LoginScreen onLogin={(name) => { setUserName(name); setIsLoggedIn(true); }} />;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', system-ui, sans-serif; background: #F9FAFB; color: #111827; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
        #root { max-width: 480px; margin: 0 auto; min-height: 100vh; background: #F9FAFB; position: relative; }
        ::-webkit-scrollbar { display: none; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes growBar { from { transform: scaleX(0); transform-origin: left; } to { transform: scaleX(1); } }
        @keyframes tickerUp { from { transform: translateY(0); } to { transform: translateY(-50%); } }
        @keyframes tickerLeft { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.15); opacity: 1; } }
      `}</style>

      <div style={{ minHeight: '100vh' }}>
        {tab === 'home' && <PulseTab key="home" userName={userName} />}
        {tab === 'coach' && <CoachTab key="coach" userName={userName} />}
        {tab === 'engine' && <EngineTab key="engine" userName={userName} />}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, padding: '12px 24px 28px', background: 'linear-gradient(180deg, transparent 0%, #F9FAFB 35%)' }}>
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 100, padding: '12px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
          {tabs.map(({ id, label, icon: Icon, accent }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 8px', position: 'relative' }}>
                <Icon size={22} color={active ? accent : '#9CA3AF'} fill={active ? accent : 'none'} strokeWidth={active ? 2.5 : 2} />
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? accent : '#9CA3AF' }}>{label}</span>
                {active && <span style={{ position: 'absolute', bottom: -2, width: 4, height: 4, borderRadius: '50%', background: accent }} />}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
