"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { LoginPage } from "@/components/LoginPage";
import DashboardPage from "./dashboard/DashboardPage";
import SalesPage from "./sales/SalesPage";
import OnboardingPage from "./onboarding/OnboardingPage";
import ProductionPage from "./production/ProductionPage";
import ApprovalsPage from "./approvals/ApprovalsPage";
import PublishingPage from "./publishing/PublishingPage";
import EditorsPage from "./editors/EditorsPage";
import AdsPage from "./ads/AdsPage";
import KnowledgePage from "./knowledge/KnowledgePage";
import UsersPage from "./users/UsersPage";
import CalendarPage from "./calendar/CalendarPage";
import ActivityPage from "./activity/ActivityPage";
import ClientsPage from "./clients/ClientsPage";
import PackagesPage from "./packages/PackagesPage";
import { AuthErrorPage } from "@/components/AuthErrorPage";
import {
  INIT_CLIENTS, INIT_VIDEOS, INIT_LEADS, INIT_ONBOARDING, INIT_ADS, EDITORS,
} from "@/lib/store";
import { logActivity } from "@/lib/activityLog";
import {
  fetchClients, fetchVideos, fetchLeads, fetchOnboarding, fetchAds, fetchUsers,
  upsertClient, upsertVideo, upsertLead, upsertOnboarding, upsertAd,
  deleteOnboarding, deleteVideo,
} from "@/lib/db";
import { isAdmin, isSuperAdmin, signOut as supabaseSignOut, onAuthStateChange } from "@/lib/auth";
import { ToastContainer, CelebrationModal, showToast } from "@/components/ui";
import type { AppUser } from "@/lib/auth";
import type { Client, Video, Lead, OnboardingClient, AdCampaign } from "@/lib/types";

export default function App() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  /* ─── Supabase Auth: restore session on mount ─── */
  useEffect(() => {
    let ignore = false;

    // Safety timeout: if INITIAL_SESSION never fires (network issue, bad env vars),
    // stop showing the loader after 5s and fall through to the login page.
    const timeout = setTimeout(() => {
      if (!ignore) {
        setAuthLoading(false);
        setMounted(true);
      }
    }, 5000);

    // onAuthStateChange handles EVERYTHING:
    // - INITIAL_SESSION: fires on page load (handles existing sessions AND /auth/callback redirect)
    // - SIGNED_IN: fires after PKCE code exchange
    // - SIGNED_OUT / TOKEN_REFRESHED / USER_UPDATED: handled in auth.ts
    const unsubscribe = onAuthStateChange((appUser) => {
      if (ignore) return;
      clearTimeout(timeout);
      if (appUser) {
        setUser({ name: appUser.username, email: appUser.email, role: appUser.role });
      } else {
        setUser(null);
      }
      // Mark auth as resolved on the first event (INITIAL_SESSION always fires)
      setAuthLoading(false);
      setMounted(true);
    });

    return () => {
      ignore = true;
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const [page, setPage] = useState("dashboard");

  useEffect(() => {
    if (user) {
      if (!["superadmin", "admin"].includes(user.role) && page === "dashboard") {
        setPage("production");
      }
    }
  }, [user, page]);

  /* ─── Shared State ─── */
  const [clients, setClients] = useState<Client[]>(INIT_CLIENTS);
  const [videos, setVideos] = useState<Video[]>(INIT_VIDEOS);
  const [leads, setLeads] = useState<Lead[]>(INIT_LEADS);
  const [onboardingClients, setOnboardingClients] = useState<OnboardingClient[]>(INIT_ONBOARDING);
  const [ads, setAds] = useState<AdCampaign[]>(INIT_ADS);

  const [celebration, setCelebration] = useState<{ title: string; message: string } | null>(null);

  /* ─── Load data from Supabase once authenticated ─── */
  useEffect(() => {
    if (!user) return; // Don't fetch until signed in
    let mounted = true;
    async function loadData() {
      const [dbClients, dbVideos, dbLeads, dbOnboarding, dbAds, dbUsers] = await Promise.all([
        fetchClients(), fetchVideos(), fetchLeads(), fetchOnboarding(), fetchAds(), fetchUsers()
      ]);
      if (!mounted) return;
      if (dbClients.length > 0) setClients(dbClients);
      if (dbVideos.length > 0) setVideos(dbVideos);
      if (dbLeads.length > 0) setLeads(dbLeads);
      if (dbOnboarding.length > 0) setOnboardingClients(dbOnboarding);
      if (dbAds.length > 0) setAds(dbAds);
      if (dbUsers.length > 0) setUsers(dbUsers);
    }
    loadData();
    return () => { mounted = false; };
  }, [user]);

  /* ─── Admin check ─── */
  const canDelete = user ? ["admin", "superadmin"].includes(user.role) : false;
  const isSuperAdminUser = user ? user.role === "superadmin" : false;

  /* ─── Sign out handler ─── */
  const handleSignOut = useCallback(async () => {
    await supabaseSignOut();
    setUser(null);
  }, []);

  /* ─── Gate: Sales → Onboarding ─── */
  const handleClosedWon = useCallback((lead: Lead) => {
    const newOb: OnboardingClient = {
      id: `ob-${Date.now()}`,
      name: lead.company,
      leadId: lead.id,
      contactPerson: lead.contactName,
      contactEmail: lead.email,
      phone: lead.phone,
      package: "Growth",
      startDate: new Date().toISOString().split("T")[0],
      steps: {
        contractSigned: false,
        invoicePaid: false,
        strategyCallDone: false,
        shootScheduled: false,
        editorAssigned: false,
        socialManagerAssigned: false,
      },
    };
    setOnboardingClients((prev) => [...prev, newOb]);
    // Persist to Supabase (fire-and-forget)
    upsertOnboarding(newOb);
    const updatedLead = { ...lead, stage: "closed_won" as Lead["stage"] };
    upsertLead(updatedLead);
    if (user) {
      logActivity({ user: user.name, action: "moved", entity: "lead", entityName: lead.company, details: "Closed Won → Onboarding" });
    }
    setCelebration({ title: "New Deal Closed!", message: `Congratulations! ${lead.company} is now a client. Time to start onboarding!` });
  }, [user]);

  /* ─── Gate: Onboarding → Production ─── */
  const handleMoveToProduction = useCallback((ob: OnboardingClient, week?: number) => {
    let assignedWeek: 1 | 2 | 3 | 4;
    if (week) {
      assignedWeek = week as 1 | 2 | 3 | 4;
    } else {
      const weekCounts = [0, 0, 0, 0];
      clients.forEach((c) => { if (c.status === "active") weekCounts[c.week - 1]++; });
      assignedWeek = (weekCounts.indexOf(Math.min(...weekCounts)) + 1) as 1 | 2 | 3 | 4;
    }

    const lead = leads.find(l => l.id === ob.leadId);

    const newClient: Client = {
      id: `c-${Date.now()}`,
      name: ob.name,
      initials: ob.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
      monthlyRevenue: lead?.estimatedRevenue || 0,
      assignedEditor: ob.assignedEditor || users.find(u => u.role === "editor")?.id || "unassigned",
      assignedSocialManager: ob.assignedSocialManager || users.find(u => u.role === "social_manager")?.id || "unassigned",
      week: assignedWeek,
      status: "active",
      contactPerson: ob.contactPerson,
      contactEmail: ob.contactEmail,
      phone: ob.phone,
      package: ob.package,
      notes: ob.notes,
      graduatedFrom: ob.id,
    };
    setClients((prev) => [...prev, newClient]);
    setOnboardingClients((prev) => prev.filter((c) => c.id !== ob.id));
    // Persist to Supabase (fire-and-forget)
    upsertClient(newClient);
    deleteOnboarding(ob.id);
    if (user) {
      logActivity({ user: user.name, action: "moved", entity: "onboarding", entityName: ob.name, details: `Moved to Production (Week ${assignedWeek})` });
    }
    setCelebration({ title: `${ob.name} is Live!`, message: `${ob.name} has moved to production in Week ${assignedWeek}. Let's create amazing content!` });
  }, [clients, user]);

  /* ─── Derived counts ─── */
  const approvalCount = videos.filter((v) => v.editingStatus === "delivered").length;

  // Show loading while checking auth session
  if (!mounted || authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAFAFA" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: 24, fontWeight: 400, letterSpacing: "0.15em", color: "var(--text)", 
            fontFamily: "'Outfit', sans-serif", textTransform: "uppercase", marginBottom: 8 
          }}>
            BEAUTICATE.
          </div>
          <div style={{ fontSize: 14, color: "var(--text-sec)" }}>Loading...</div>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) return <LoginPage onLogin={setUser} />;

  const currentUserPerms = users.find(u => u.username === user.name)?.permissions;

  const renderPage = () => {
    // Guard: redirect if user lacks permission for this page
    if (currentUserPerms && currentUserPerms[page] === false) {
      return <ProductionPage clients={clients} videos={videos} setVideos={setVideos} canDelete={canDelete} />;
    }
    switch (page) {
      case "dashboard":
        return <DashboardPage clients={clients} videos={videos} leads={leads} ads={ads} users={users} />;
      case "calendar":
        return <CalendarPage clients={clients} videos={videos} users={users} />;
      case "sales":
        return <SalesPage leads={leads} setLeads={setLeads} onClosedWon={handleClosedWon} canDelete={canDelete} />;
      case "onboarding":
        return (
          <OnboardingPage
            onboardingClients={onboardingClients}
            setOnboardingClients={setOnboardingClients}
            onMoveToProduction={handleMoveToProduction}
            canDelete={canDelete}
            users={users}
          />
        );
      case "clients":
        return <ClientsPage clients={clients} setClients={setClients} canDelete={canDelete} />;
      case "production":
        return <ProductionPage clients={clients} videos={videos} setVideos={setVideos} canDelete={canDelete} users={users} currentUser={user} />;
      case "approvals":
        return <ApprovalsPage videos={videos} setVideos={setVideos} userName={user.name} clients={clients} users={users} />;
      case "publishing":
        return <PublishingPage videos={videos} setVideos={setVideos} userName={user.name} clients={clients} users={users} />;
      case "editors":
        return <EditorsPage videos={videos} users={users} />;
      case "ads":
        return <AdsPage ads={ads} setAds={setAds} clients={clients} canDelete={canDelete} />;
      case "packages":
        return <PackagesPage />;
      case "knowledge":
        return <KnowledgePage canDelete={canDelete} />;
      case "activity":
        return <ActivityPage />;
      case "users":
        return isSuperAdminUser ? <UsersPage users={users} setUsers={setUsers} /> : <DashboardPage clients={clients} videos={videos} leads={leads} ads={ads} users={users} />;
      default:
        return <DashboardPage clients={clients} videos={videos} leads={leads} ads={ads} users={users} />;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", color: "var(--text)", background: "var(--bg)" }}>
      <Sidebar
        currentPage={page}
        onNavigate={setPage}
        userName={user.name}
        userRole={user.role}
        approvalCount={approvalCount}
        onSignOut={handleSignOut}
        videos={videos}
        leads={leads}
        clients={clients}
        ads={ads}
        permissions={currentUserPerms}
        users={users}
      />
      <div style={{ flex: 1, padding: page === "knowledge" ? 0 : "48px 64px", overflowY: "auto", minHeight: "100vh" }}>
        {renderPage()}
      </div>
      <ToastContainer />
      {celebration && (
        <CelebrationModal title={celebration.title} message={celebration.message} onClose={() => setCelebration(null)} />
      )}
    </div>
  );
}
