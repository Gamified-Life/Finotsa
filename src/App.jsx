import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Bell, Activity, Play, Cpu, ChevronRight, ShieldAlert, TrendingDown,
  TrendingUp, ArrowDownRight, Briefcase, Zap, Target, Shield,
  AlertTriangle, CheckCircle, Info, Camera
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
  const [budget, setBudget] = useState(null);
  const GREEN = '#1A4731';
  const GREEN_TINT = '#D1FAE5';
  const AMBER = '#D97706';
  const AMBER_TINT = '#FFFBEB';

  useEffect(() => {
    const fetchPulseData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = session?.user ? { 'x-user-id': session.user.id } : {};
        const res = await fetch('/api/pulse', { headers });
        const data = await res.json();
        setDetailedCategories(data.detailedCategories);
        setBudget(data.budget);
      } catch (err) {
        console.error("Error fetching pulse data:", err);
      }
    };
    fetchPulseData();
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
            <AnimatedNumber value={budget ? budget.safeToday : 0} duration={900} style={{ fontSize: 64, fontWeight: 800, color: GREEN, letterSpacing: '-0.04em', lineHeight: 1 }} />
          </div>
          <p style={{ fontSize: 13, color: `${GREEN}99`, marginTop: 8, fontWeight: 500 }}>₹{budget ? budget.availableForMonth.toLocaleString('en-IN') : 0} available this month</p>

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
          className="glow-button-white"
          onClick={() => setShowBreakdown(!showBreakdown)}
          style={{ width: '100%', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Why exactly ₹{budget ? budget.safeToday : 0}?</span>
          <ChevronRight size={16} color="#9CA3AF" style={{ transform: showBreakdown ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </button>

        {showBreakdown && budget && (
          <div style={{ background: '#fff', borderRadius: '0 0 16px 16px', border: '1px solid #E5E7EB', borderTop: 'none', padding: '0 20px 20px', animation: 'fadeDown 0.2s ease' }}>
            <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 16 }}>
              {/* Phase 1 */}
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Step 1 — Monthly Available</p>
              {[
                { label: 'Monthly Income', value: `₹${budget.monthlyIncome.toLocaleString('en-IN')}`, color: '#111827', indent: false },
                { label: 'Fixed Expenses (Rent, EMI)', value: `− ₹${budget.fixedExpenses.toLocaleString('en-IN')}`, color: '#DC2626', indent: true },
                { label: 'Subscriptions', value: `− ₹${budget.subsSpend.toLocaleString('en-IN')}`, color: '#DC2626', indent: true },
                { label: 'Emergency Buffer', value: `− ₹${budget.emergencyBuffer.toLocaleString('en-IN')}`, color: '#D97706', indent: true },
                ...(budget.goals || []).map(g => ({ label: `Goal: ${g.name}`, value: `− ₹${g.target.toLocaleString('en-IN')}`, color: '#D97706', indent: true }))
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderLeft: row.indent ? `3px solid ${row.color}22` : 'none', paddingLeft: row.indent ? 12 : 0 }}>
                  <span style={{ fontSize: 13, color: row.indent ? '#6B7280' : '#111827', fontWeight: row.indent ? 400 : 600 }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: row.color, fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px dashed #E5E7EB', marginTop: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Available for Month</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: GREEN, fontVariantNumeric: 'tabular-nums' }}>₹{budget.availableForMonth.toLocaleString('en-IN')}</span>
              </div>
              {/* Phase 2 */}
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 12, marginBottom: 10 }}>Step 2 — Daily Limit</p>
              {[
                { label: 'Days in Month Remaining', value: `${budget.daysRemaining} remaining`, color: '#111827', indent: false },
                { label: 'Base Daily Limit', value: `₹${budget.baseDailyLimit.toLocaleString('en-IN')}`, color: '#6B7280', indent: true },
                { label: 'Weekend AI Adjustment', value: `− ₹${Math.abs(budget.aiAdjustment).toLocaleString('en-IN')}`, color: '#DC2626', indent: true },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderLeft: row.indent ? '3px solid #E5E7EB' : 'none', paddingLeft: row.indent ? 12 : 0 }}>
                  <span style={{ fontSize: 13, color: row.indent ? '#6B7280' : '#111827', fontWeight: row.indent ? 400 : 600 }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: row.color, fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: GREEN_TINT, borderRadius: 10, marginTop: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: GREEN }}>Safe Today</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: GREEN, fontVariantNumeric: 'tabular-nums' }}>₹{budget.safeToday.toLocaleString('en-IN')}</span>
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
    const fetchCoachData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = session?.user ? { 'x-user-id': session.user.id } : {};
        const res = await fetch('/api/coach', { headers });
        const data = await res.json();
        setCoachData(data);
      } catch (err) {
        console.error("Error fetching coach data:", err);
      }
    };
    fetchCoachData();
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
                        className={completedOpps[i] ? "" : "glow-button"}
                        onClick={() => handleAct(i)}
                        disabled={actingOn === i || completedOpps[i]}
                        style={{ background: completedOpps[i] ? '#16A34A' : AMBER, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: (actingOn === i || completedOpps[i]) ? 'default' : 'pointer', opacity: actingOn === i ? 0.7 : 1 }}
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
  const [isUploading, setIsUploading] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [simAmount, setSimAmount] = useState('');
  const [simShop, setSimShop] = useState('');
  const [newIncome, setNewIncome] = useState('');
  const [newRent, setNewRent] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchEngineData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = session?.user ? { 'x-user-id': session.user.id } : {};
      const res = await fetch('/api/engine', { headers });
      const data = await res.json();
      setEngineData(data);
    } catch (err) {
      console.error("Error fetching engine data:", err);
    }
  };

  useEffect(() => {
    fetchEngineData();
    
    // Check if we just returned from AA consent flow
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('consent_status') === 'success') {
      verifyConsent();
    }
  }, []);

  const verifyConsent = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = session?.user ? { 'x-user-id': session.user.id } : {};
      await fetch('/api/aa/verify', { method: 'POST', headers });
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchEngineData();
    } catch(e) {
      console.error(e);
    }
  };

  const handleLinkBank = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = session?.user ? { 'x-user-id': session.user.id } : {};
      const res = await fetch('/api/aa/consent', { method: 'POST', headers });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch(e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result.split(',')[1];
        
        const { data: { session } } = await supabase.auth.getSession();
        const headers = {
          'Content-Type': 'application/json',
          ...(session?.user ? { 'x-user-id': session.user.id } : {})
        };

        const res = await fetch('/api/upload-statement', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            imageBase64: base64String,
            mimeType: file.type
          })
        });
        const data = await res.json();
        if (data.success) {
          alert(`Success! Imported ${data.count} transactions from screenshot.`);
          fetchEngineData();
        } else {
          alert('Failed to process screenshot.');
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error(e);
      alert('Error uploading screenshot');
    }
    setIsUploading(false);
  };

  if (!engineData) return <div style={{ padding: 24 }}>Loading Engine...</div>;

  const handleSimulateSync = async () => {
    if (!simAmount || !simShop) return;
    setIsSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || 1;
      const headers = { 'Content-Type': 'application/json', ...(session?.user ? { 'x-user-id': session.user.id } : {}) };
      
      const res = await fetch('/api/webhook/transaction', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, amount: Number(simAmount), shopName: simShop })
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
      const { data: { session } } = await supabase.auth.getSession();
      const headers = session?.user ? { 'x-user-id': session.user.id } : {};
      await fetch('/api/cron/engine-sweep', { method: 'POST', headers });
      fetchEngineData(); // Refresh portfolio and ticker
    } catch (e) {
      console.error("Sweep failed", e);
    }
    setIsSweeping(false);
  };

  const handleUpdateProfile = async () => {
    if (!newIncome || !newRent) return;
    setIsUpdating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { 'Content-Type': 'application/json', ...(session?.user ? { 'x-user-id': session.user.id } : {}) };
      await fetch('/api/user/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify({ monthlyIncome: newIncome, fixedExpenses: newRent })
      });
      setNewIncome('');
      setNewRent('');
      alert("Profile updated! Check the Pulse tab for new budget.");
    } catch (e) {
      console.error("Update failed", e);
    }
    setIsUpdating(false);
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

      {/* Connected Bank Accounts (Setu AA) */}
      <div style={{ padding: '0 24px 120px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Connected Bank Accounts</p>
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, padding: '20px', color: '#111827', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          {engineData.bankLinked ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={20} color="#10B981" />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700 }}>HDFC Bank</p>
                    <p style={{ fontSize: 12, color: '#9CA3AF' }}>Linked via Setu AA</p>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: 100 }}>Active</span>
              </div>
              <button 
                className="glow-button-white"
                onClick={async () => {
                  setIsSyncing(true);
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const headers = session?.user ? { 'x-user-id': session.user.id } : {};
                    const res = await fetch('/api/aa/sync', { method: 'POST', headers });
                    const data = await res.json();
                    if(data.success) {
                       setSyncResult(data.transaction);
                       fetchEngineData();
                    }
                  } catch(e) {}
                  setIsSyncing(false);
                  setTimeout(() => setSyncResult(null), 3000);
                }}
                disabled={isSyncing}
                style={{ width: '100%', padding: '12px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: isSyncing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Activity size={14} /> {isSyncing ? 'Syncing...' : 'Sync Latest Transactions'}
              </button>
              {syncResult && (
                <div style={{ marginTop: 12, padding: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px dashed #10B981', borderRadius: 12, animation: 'fadeDown 0.3s ease' }}>
                  <p style={{ fontSize: 11, color: '#10B981', fontWeight: 600, marginBottom: 4 }}>✓ Found & Categorized</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13 }}>{syncResult.shopName}</span>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>₹{syncResult.amount}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
               <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
                 Your bank is successfully linked.
               </p>
            </div>
          )}

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #F3F4F6' }}>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12, lineHeight: 1.5 }}>
              Update Financial Profile (Income & Fixed Expenses)
            </p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <input 
                type="number" 
                placeholder="Monthly Income (₹)" 
                value={newIncome}
                onChange={e => setNewIncome(e.target.value)}
                style={{ flex: 1, padding: '12px 14px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, color: '#111827', fontSize: 14, outline: 'none' }}
              />
              <input 
                type="number" 
                placeholder="Fixed Expenses (₹)" 
                value={newRent}
                onChange={e => setNewRent(e.target.value)}
                style={{ flex: 1, padding: '12px 14px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, color: '#111827', fontSize: 14, outline: 'none' }}
              />
            </div>
            <button 
              className="glow-button-white"
              onClick={handleUpdateProfile}
              disabled={isUpdating || !newIncome || !newRent}
              style={{ width: '100%', padding: '14px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: isUpdating ? 'not-allowed' : 'pointer', opacity: (!newIncome || !newRent) ? 0.5 : 1 }}
            >
              {isUpdating ? 'Updating...' : 'Update Profile'}
            </button>
          </div>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #F3F4F6' }}>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12, lineHeight: 1.5 }}>
              Test the Nightly Sweep! The Engine checks your daily transactions, rounds them up, and auto-invests the difference.
            </p>
            <button 
              className="glow-button-green-outline"
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const GREEN = '#1A4731';

  const handleAuth = async () => {
    if (!email || !password || (isSignUp && !name)) return;
    
    // Developer bypass for rate limits
    if (email === 'dev@gmail.com' && (password === 'dev135' || password === 'dev')) {
      onLogin(name || 'Developer');
      return;
    }
    
    if (!email.toLowerCase().endsWith('@gmail.com') && !email.toLowerCase().endsWith('@yahoo.com')) {
      setError('Please use a @gmail.com or @yahoo.com email address.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        const { data, error: signupError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: { full_name: name } }
        });
        if (signupError) throw signupError;
        if (data?.user) onLogin(name || 'User');
      } else {
        const { data, error: signinError } = await supabase.auth.signInWithPassword({ email, password });
        if (signinError) throw signinError;
        if (data?.user) onLogin(data.user.user_metadata?.full_name || 'User');
      }
    } catch (e) {
      console.error('Auth Error Details:', e);
      // Detailed error for common failures
      if (e.message === 'Failed to fetch') {
        setError('Network Error: Check if Supabase URL is correct and reachable. If on Vercel, ensure environment variables are set.');
      } else {
        setError(e.message || 'An unexpected error occurred');
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0F3122', color: '#fff', padding: 24, animation: 'fadeUp 0.5s ease' }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: '#1A4731', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
        <Zap size={32} color="#10B981" />
      </div>
      <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 8, textAlign: 'center', color: '#fff' }}>Welcome to Finotsa</h1>
      <p style={{ fontSize: 15, color: '#A7F3D0', marginBottom: 40, textAlign: 'center' }}>Your intelligent financial operating system.</p>
      
      <div style={{ width: '100%', maxWidth: 320 }}>
        {error && <p style={{ color: '#FCA5A5', fontSize: 13, marginBottom: 16, textAlign: 'center', background: 'rgba(239, 68, 68, 0.2)', padding: 8, borderRadius: 8 }}>{error}</p>}
        {isSignUp && (
          <input 
            type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name"
            style={{ fontFamily: 'inherit', width: '100%', padding: '16px 20px', fontSize: 16, borderRadius: 16, border: 'none', background: '#fff', color: '#111827', outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}
          />
        )}
        <input 
          type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"
          style={{ fontFamily: 'inherit', width: '100%', padding: '16px 20px', fontSize: 16, borderRadius: 16, border: 'none', background: '#fff', color: '#111827', outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}
        />
        <input 
          type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
          style={{ fontFamily: 'inherit', width: '100%', padding: '16px 20px', fontSize: 16, borderRadius: 16, border: 'none', background: '#fff', color: '#111827', outline: 'none', marginBottom: 24, boxSizing: 'border-box' }}
        />
        <button 
          className={(email && password) ? "glow-button" : ""}
          onClick={handleAuth} disabled={loading || !email || !password}
          style={{ width: '100%', padding: 16, borderRadius: 16, background: (email && password) ? '#10B981' : '#1A4731', color: (email && password) ? '#fff' : '#6EE7B7', border: 'none', fontSize: 16, fontWeight: 700, cursor: (email && password) ? 'pointer' : 'not-allowed' }}
        >
          {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
        </button>
        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          style={{ width: '100%', marginTop: 16, background: 'none', border: 'none', color: '#A7F3D0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        </button>
      </div>
    </div>
  );
};

// ─── ONBOARDING SCREEN ────────────────────────────────────────────────────────
const OnboardingScreen = ({ onLinked }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const GREEN = '#1A4731';
  const INDIGO = '#4338CA';

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('consent_status') === 'success') {
      verifyConsent();
    }
  }, []);

  const verifyConsent = async () => {
    setIsVerifying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = session?.user ? { 'x-user-id': session.user.id } : {};
      await fetch('/api/aa/verify', { method: 'POST', headers });
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      onLinked();
    } catch(e) {
      console.error(e);
      setIsVerifying(false);
    }
  };

  const handleLinkBank = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = session?.user ? { 'x-user-id': session.user.id } : {};
      const res = await fetch('/api/aa/consent', { method: 'POST', headers });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch(e) { console.error(e); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result.split(',')[1];
        const { data: { session } } = await supabase.auth.getSession();
        const headers = { 'Content-Type': 'application/json', ...(session?.user ? { 'x-user-id': session.user.id } : {}) };

        const res = await fetch('/api/upload-statement', {
          method: 'POST', headers,
          body: JSON.stringify({ imageBase64: base64String, mimeType: file.type })
        });
        const data = await res.json();
        if (data.success) {
          alert(`Success! Imported ${data.count} transactions.`);
          onLinked();
        } else { alert('Failed to process screenshot.'); }
      };
      reader.readAsDataURL(file);
    } catch (e) { alert('Error uploading screenshot'); }
    setIsUploading(false);
  };

  if (isVerifying) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <Shield size={40} color="#10B981" style={{ animation: 'pulse 2s infinite', marginBottom: 16 }} />
        <p style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Securing your connection...</p>
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 8 }}>Fetching encrypted data from Setu AA</p>
      </div>
    );
  }

  const ChalkText = ({ children, style = {} }) => (
    <span style={{ fontFamily: "'Caveat', cursive", fontSize: 24, color: '#fff', opacity: 0.9, ...style }}>{children}</span>
  );

  const GlowingArrow = ({ style = {}, flip = false, rotate = 0 }) => (
    <svg width="180" height="100" viewBox="0 0 180 100" style={{ position: 'absolute', filter: 'drop-shadow(0 0 12px #10B981)', transform: `rotate(${rotate}deg) ${flip ? 'scaleX(-1)' : ''}`, pointerEvents: 'none', ...style }}>
      <path 
        d="M 10 10 Q 90 10 170 80" 
        fill="none" stroke="#10B981" strokeWidth="4.5" strokeDasharray="12 8" strokeLinecap="round"
      />
      <path 
        d="M 155 70 L 170 80 L 150 85" 
        fill="none" stroke="#10B981" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#081A12', position: 'relative', overflow: 'hidden' }}>
      {/* Background Decor */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', width: 300, height: 300, background: '#10B981', filter: 'blur(150px)', opacity: 0.1, borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 400, height: 400, background: '#1A4731', filter: 'blur(150px)', opacity: 0.2, borderRadius: '50%' }} />

      <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <Shield size={32} color="#10B981" />
      </div>
      
      <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 12, textAlign: 'center', color: '#fff' }}>Connect Your Data</h1>
      <p style={{ fontSize: 15, color: '#A7F3D0', marginBottom: 80, textAlign: 'center', lineHeight: 1.5, maxWidth: 360, opacity: 0.8 }}>
        Choose how you want to fuel your financial engine. Real data leads to real growth.
      </p>

      <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 60, position: 'relative' }}>
        
        {/* Option 1 */}
        <div style={{ position: 'relative' }}>
          <GlowingArrow style={{ top: -45, left: -165 }} rotate={-5} />
          <ChalkText style={{ position: 'absolute', top: -75, left: -380, width: 220, textAlign: 'right' }}>Live data from your real bank</ChalkText>
          <button 
            className="glow-button"
            onClick={handleLinkBank}
            style={{ width: '100%', padding: '18px', background: '#10B981', color: '#0F3122', border: 'none', borderRadius: 18, fontSize: 16, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
          >
            <Shield size={20} /> Link Real Bank (Setu AA)
          </button>
        </div>

        {/* Option 2 */}
        <div style={{ position: 'relative' }}>
          <GlowingArrow style={{ top: -25, right: -165 }} rotate={-5} flip />
          <ChalkText style={{ position: 'absolute', top: -55, right: -380, width: 220, textAlign: 'left' }}>Just want to see how it works?</ChalkText>
          <button 
            className="glow-button-white"
            onClick={onLinked}
            style={{ width: '100%', padding: '18px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, backdropFilter: 'blur(10px)' }}
          >
            Explore with Demo Bank
          </button>
        </div>

        {/* Option 3 */}
        <div style={{ position: 'relative' }}>
          <GlowingArrow style={{ top: -25, left: -165 }} rotate={-5} />
          <ChalkText style={{ position: 'absolute', top: -70, left: -420, width: 260, textAlign: 'right' }}>
            Privacy first. No Login Needed<br/>
            <span style={{ fontSize: 16, opacity: 0.7 }}>(Upload screenshot of Bank balance and Transaction History)</span>
          </ChalkText>
          <div style={{ position: 'relative' }}>
            <input 
              type="file" accept="image/*" onChange={handleFileUpload} 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: isUploading ? 'not-allowed' : 'pointer', zIndex: 2 }}
              disabled={isUploading}
            />
            <button 
              className="glow-button-green-outline"
              style={{ width: '100%', padding: '18px', background: 'rgba(16, 185, 129, 0.05)', color: '#A7F3D0', border: '1.5px dashed rgba(16, 185, 129, 0.3)', borderRadius: 18, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              <Camera size={20} /> {isUploading ? 'Extracting...' : 'Upload Statement'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
const LandingPage = ({ onGetStarted }) => {
  const coinsRef = useRef([]);

  // Framer Motion Scroll Values for 3D Magic Effect
  const { scrollY } = useScroll();
  const heroScale = useTransform(scrollY, [0, 500], [1, 0.8]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroRotateX = useTransform(scrollY, [0, 500], [0, 25]);
  const heroY = useTransform(scrollY, [0, 500], [0, -100]);

  const mockupOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  
  const rightImageScale = useTransform(scrollY, [300, 800], [0.8, 1]);
  const rightImageRotateX = useTransform(scrollY, [300, 1000], [45, 10]);
  const rightImageRotateY = useTransform(scrollY, [300, 1000], [-30, 15]);
  const rightImageRotateZ = useTransform(scrollY, [300, 1000], [10, -5]);
  const rightImageY = useTransform(scrollY, [300, 1000], [100, -50]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const progress = Math.max(0, currentScrollY - 200) / 1000;
      
      coinsRef.current.forEach((coin, i) => {
        if (!coin) return;
        const angle = (i * 137.5) * (Math.PI / 180) + (currentScrollY * 0.002);
        const baseDistance = 200 + (i % 5) * 100;
        const distance = progress * baseDistance; 
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance - (currentScrollY * 0.3);
        const rotX = currentScrollY * 0.4 + i * 40;
        const rotY = currentScrollY * 0.5 + i * 30;
        const rotZ = currentScrollY * 0.3 + i * 20;
        
        coin.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`;
        coin.style.opacity = Math.min(progress * 2.5, 0.9);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const coins = Array.from({ length: 40 }).map((_, i) => (
    <div 
      key={i} 
      ref={el => coinsRef.current[i] = el}
      style={{
        position: 'absolute', top: 0, left: 0,
        width: 80, height: 40, borderRadius: 4,
        background: '#10B981',
        boxShadow: '0 4px 8px rgba(0,0,0,0.4), inset 0 0 0 2px #047857',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 900, fontSize: 18,
        opacity: 0, transform: 'translate(-50%, -50%)',
        pointerEvents: 'none', zIndex: 0
      }}
    >
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        ₹
      </div>
    </div>
  ));

  return (
    <>
    <div style={{ minHeight: '100vh', background: '#0F3122', color: '#fff', overflowX: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', perspective: 1500 }}>
      {/* Decorative Glows */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, background: '#10B981', filter: 'blur(150px)', opacity: 0.3, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -150, right: -100, width: 500, height: 500, background: '#1A4731', filter: 'blur(120px)', opacity: 0.5, borderRadius: '50%' }} />
      </div>
      
      {/* Navbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={20} color="#0F3122" />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>Finotsa</span>
        </div>
        <button 
          className="glow-button-white"
          onClick={onGetStarted}
          style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(10px)' }}
        >
          Sign In
        </button>
      </div>

      {/* Hero Section */}
      <motion.div 
        style={{ 
          scale: heroScale, opacity: heroOpacity, rotateX: heroRotateX, y: heroY,
          minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 10, textAlign: 'center', transformOrigin: 'center 200px'
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 100, marginBottom: 24 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#A7F3D0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Financial OS 2.0</span>
        </div>
        
        <h1 style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: 20, maxWidth: 600 }}>
          The Intelligent Autopilot for Your Wealth.
        </h1>
        
        <p style={{ fontSize: 18, color: '#A7F3D0', lineHeight: 1.6, marginBottom: 40, maxWidth: 500, opacity: 0.9 }}>
          Connect your accounts once. Let our AI classify transactions, optimize subscriptions, and auto-invest your spare change.
        </p>

        <button 
          className="glow-button"
          onClick={onGetStarted}
          style={{ padding: '18px 40px', background: '#10B981', color: '#0F3122', border: 'none', borderRadius: 100, fontSize: 18, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          Enter the OS <Activity size={20} />
        </button>
      </motion.div>

      {/* Mockup UI Hint at Bottom */}
      <motion.div style={{ opacity: mockupOpacity, position: 'relative', height: 200, display: 'flex', justifyContent: 'center', perspective: '1000px', zIndex: 10 }}>
        <div style={{ width: 360, height: 280, background: '#fff', borderRadius: '24px 24px 0 0', padding: 24, boxShadow: '0 -20px 40px rgba(0,0,0,0.4)', transform: 'rotateX(20deg) translateY(20px)', border: '1px solid rgba(255,255,255,0.2)', borderBottom: 'none' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
             <div style={{ width: 120, height: 12, background: '#E5E7EB', borderRadius: 10 }} />
             <div style={{ width: 40, height: 40, background: '#EEF2FF', borderRadius: 12 }} />
           </div>
           <div style={{ width: 200, height: 32, background: '#1A4731', borderRadius: 8, marginBottom: 16 }} />
           <div style={{ width: '100%', height: 100, background: '#F9FAFB', borderRadius: 16, border: '1px solid #E5E7EB' }} />
        </div>
      </motion.div>

      {/* Scrolling Features Section */}
      <div style={{ padding: '100px 5%', background: '#082015', position: 'relative', zIndex: 11, overflow: 'hidden' }}>
        
        {/* Exploding Coins Background */}
        <div style={{ position: 'absolute', top: '60%', left: '50%', width: 1, height: 1, zIndex: 0, perspective: 1000 }}>
          {coins}
        </div>

        <div style={{ textAlign: 'center', marginBottom: 60, position: 'relative', zIndex: 2 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 16, letterSpacing: '-0.03em' }}>Your Money, Automated.</h2>
          <p style={{ color: '#A7F3D0', fontSize: 18 }}>Three steps to total financial clarity.</p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 60, justifyContent: 'center', position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto' }}>
          
          {/* Left Side: Steps */}
          <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: 60, paddingBottom: 100 }}>
          {/* Feature 1 */}
          <div style={{ position: 'sticky', top: 100, background: '#0F3122', padding: 32, borderRadius: 32, border: '1px solid rgba(16, 185, 129, 0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', transition: 'transform 0.3s ease' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Zap size={28} color="#0F3122" />
            </div>
            <h3 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, color: '#fff', letterSpacing: '-0.02em' }}>1. Connect & Sync</h3>
            <p style={{ color: '#A7F3D0', fontSize: 16, lineHeight: 1.6 }}>Securely link your bank using India's Account Aggregator framework. Real-time updates without ever sharing your credentials.</p>
          </div>

          {/* Feature 2 */}
          <div style={{ position: 'sticky', top: 120, background: '#0A2519', padding: 32, borderRadius: 32, border: '1px solid rgba(16, 185, 129, 0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', transition: 'transform 0.3s ease' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Target size={28} color="#0F3122" />
            </div>
            <h3 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, color: '#fff', letterSpacing: '-0.02em' }}>2. AI Categorizes</h3>
            <p style={{ color: '#A7F3D0', fontSize: 16, lineHeight: 1.6 }}>Our Gemini-powered engine categorizes every swipe perfectly. It finds hidden subscriptions, leaks, and computes your Health Score.</p>
          </div>

          {/* Feature 3 */}
          <div style={{ position: 'sticky', top: 140, background: '#06170F', padding: 32, borderRadius: 32, border: '1px solid rgba(16, 185, 129, 0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', transition: 'transform 0.3s ease' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <TrendingUp size={28} color="#0F3122" />
            </div>
            <h3 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, color: '#fff', letterSpacing: '-0.02em' }}>3. Auto-Invest</h3>
            <p style={{ color: '#A7F3D0', fontSize: 16, lineHeight: 1.6 }}>We automatically round up your daily transactions and sweep the difference into a secure index fund. You invest seamlessly while you spend.</p>
          </div>
          </div>

          {/* Right Side: 3D CSS Phone Mockup */}
          <div style={{ flex: '1 1 500px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', position: 'sticky', top: 120, height: 'calc(100vh - 200px)', perspective: 1500 }}>
            <motion.div 
              style={{ 
                width: 300, height: 600, background: '#fff', borderRadius: 40,
                border: '12px solid #111827', boxShadow: '0 40px 60px rgba(0,0,0,0.6), inset 0 0 0 2px #374151',
                scale: rightImageScale, rotateX: rightImageRotateX, rotateY: rightImageRotateY, rotateZ: rightImageRotateZ, y: rightImageY,
                position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column'
              }} 
            >
              {/* Notch */}
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 120, height: 26, background: '#111827', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, zIndex: 10 }} />
              
              {/* App UI */}
              <div style={{ background: '#10B981', padding: '50px 20px 20px', color: '#0F3122' }}>
                <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, marginBottom: 4 }}>Total Wealth</p>
                <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em' }}>₹1,24,500</h2>
              </div>
              <div style={{ flex: 1, background: '#F9FAFB', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
                {[
                  { name: 'Netflix', date: 'Today', amount: '-₹649', color: '#EF4444', bg: '#FEE2E2', icon: Play },
                  { name: 'Salary', date: 'Yesterday', amount: '+₹85,000', color: '#10B981', bg: '#D1FAE5', icon: Briefcase },
                  { name: 'Spotify', date: '2 days ago', amount: '-₹119', color: '#10B981', bg: '#D1FAE5', icon: Activity },
                  { name: 'Amazon', date: '3 days ago', amount: '-₹1,450', color: '#F59E0B', bg: '#FEF3C7', icon: Zap },
                  { name: 'Swiggy', date: '3 days ago', amount: '-₹340', color: '#3B82F6', bg: '#DBEAFE', icon: Info }
                ].map((tx, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: 12, borderRadius: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: tx.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <tx.icon size={16} color={tx.color} />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{tx.name}</p>
                        <p style={{ fontSize: 11, color: '#6B7280' }}>{tx.date}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: tx.amount.startsWith('+') ? '#10B981' : '#111827' }}>{tx.amount}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        <div style={{ textAlign: 'center', paddingTop: 40, borderTop: '1px solid rgba(255,255,255,0.1)', position: 'relative', zIndex: 2 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 24, letterSpacing: '-0.03em' }}>Ready to take control?</h2>
          <button 
            className="glow-button"
            onClick={onGetStarted}
            style={{ padding: '18px 40px', background: '#10B981', color: '#0F3122', border: 'none', borderRadius: 100, fontSize: 18, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10 }}
          >
            Start for free <ArrowDownRight size={20} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#020617', padding: '30px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, zIndex: 20, position: 'relative', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={16} color="#F8FAFC" />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>Finotsa</span>
        </div>
        <div style={{ display: 'flex', gap: 32 }}>
          {['About', 'Privacy', 'Terms', 'Contact'].map(link => (
            <a key={link} href="#" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>{link}</a>
          ))}
        </div>
        <div style={{ color: '#94A3B8', fontSize: 14 }}>
          © 2026 Finotsa. All rights reserved.
        </div>
      </div>
    </div>
    
    {/* Floating Bottom Right Scroll Arrow */}
    <motion.div 
      style={{ 
        position: 'fixed', bottom: 40, right: 40, 
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, 
        zIndex: 50, animation: 'bounceDown 2s infinite',
        opacity: heroOpacity, pointerEvents: 'none'
      }}
    >
      <span style={{ fontFamily: "'Caveat', cursive", fontSize: 24, color: '#A7F3D0', textShadow: '0 0 10px rgba(16,185,129,0.5)' }}>Scroll</span>
      <svg width="60" height="60" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 0 12px #10B981)' }}>
        <path d="M 30 20 Q 70 20 70 50 L 85 50 L 55 90 L 25 50 L 40 50 Q 40 40 30 40 Z" fill="none" stroke="#10B981" strokeWidth="6" strokeLinejoin="round" />
        <path d="M 30 20 Q 70 20 70 50 L 85 50 L 55 90 L 25 50 L 40 50 Q 40 40 30 40 Z" fill="#A7F3D0" opacity="0.8" />
      </svg>
    </motion.div>
    </>
  );
};

// ─── APP SHELL ────────────────────────────────────────────────────────────────
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [userName, setUserName] = useState('');
  const [tab, setTab] = useState('home');
  const [bankLinked, setBankLinked] = useState(null);

  const checkBankStatus = async (session) => {
    try {
      const headers = session?.user ? { 'x-user-id': session.user.id } : {};
      const res = await fetch('/api/engine', { headers });
      const data = await res.json();
      setBankLinked(data.bankLinked);
    } catch(e) { console.error(e); setBankLinked(false); }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUserName(session.user.user_metadata?.full_name || 'User');
        checkBankStatus(session);
      } else { 
        // Only set to false if we haven't already manually linked (bypass)
        setBankLinked(prev => prev === true ? true : false); 
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUserName(session.user.user_metadata?.full_name || 'User');
        checkBankStatus(session);
      } else if (!isLoggedIn) {
        // Only log out if we aren't using the dev bypass
        setIsLoggedIn(false);
        setBankLinked(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [isLoggedIn]);
  
  const tabs = [
    { id: 'home', icon: Activity, label: 'Pulse', accent: '#1A4731' },
    { id: 'coach', icon: Target, label: 'Coach', accent: '#B45309' },
    { id: 'engine', icon: Cpu, label: 'Engine', accent: '#4338CA' },
  ];

  if (!isLoggedIn) {
    if (!showAuth) {
      return <LandingPage onGetStarted={() => setShowAuth(true)} />;
    }
    return <LoginScreen onLogin={(name) => { 
      setUserName(name); 
      setIsLoggedIn(true); 
    }} />;
  }

  if (bankLinked === null) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!bankLinked) {
    return <OnboardingScreen onLinked={() => setBankLinked(true)} />;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Caveat:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', system-ui, sans-serif; background: #F9FAFB; color: #111827; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
        ::-webkit-scrollbar { display: none; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes growBar { from { transform: scaleX(0); transform-origin: left; } to { transform: scaleX(1); } }
        @keyframes tickerUp { from { transform: translateY(0); } to { transform: translateY(-50%); } }
        @keyframes tickerLeft { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.15); opacity: 1; } }
        @keyframes bounceDown { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(10px); } }
      `}</style>

      <div style={{ minHeight: '100vh', maxWidth: 480, margin: '0 auto', background: '#F9FAFB', position: 'relative', boxShadow: '0 0 50px rgba(0,0,0,0.05)' }}>
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
