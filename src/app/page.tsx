"use client";

import React, { useState, useCallback } from "react";
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
import {
  INIT_CLIENTS, INIT_VIDEOS, INIT_LEADS, INIT_ONBOARDING, INIT_ADS, TEAM, EDITORS,
} from "@/lib/store";
import { INIT_USERS, isAdmin, isSuperAdmin } from "@/lib/auth";
import type { AppUser } from "@/lib/auth";
import type { Client, Video, Lead, OnboardingClient, AdCampaign } from "@/lib/types";

export default function App() {
  const [users, setUsers] = useState<AppUser[]>(INIT_USERS);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("agencyos_user");
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  React.useEffect(() => {
    if (user) {
      sessionStorage.setItem("agencyos_user", JSON.stringify(user));
    } else {
      sessionStorage.removeItem("agencyos_user");
    }
  }, [user]);

  const [page, setPage] = useState("dashboard");

  /* ─── Shared State ─── */
  const [clients, setClients] = useState<Client[]>(INIT_CLIENTS);
  const [videos, setVideos] = useState<Video[]>(INIT_VIDEOS);
  const [leads, setLeads] = useState<Lead[]>(INIT_LEADS);
  const [onboardingClients, setOnboardingClients] = useState<OnboardingClient[]>(INIT_ONBOARDING);
  const [ads, setAds] = useState<AdCampaign[]>(INIT_ADS);

  /* ─── Admin check ─── */
  const canDelete = user ? isAdmin(user.name) : false;
  const isSuperAdminUser = user ? isSuperAdmin(user.name) : false;

  /* ─── Gate: Sales → Onboarding ─── */
  const handleClosedWon = useCallback((lead: Lead) => {
    const newOb: OnboardingClient = {
      id: `ob-${Date.now()}`,
      name: lead.company,
      leadId: lead.id,
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
  }, []);

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

    const newClient: Client = {
      id: `c-${Date.now()}`,
      name: ob.name,
      initials: ob.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
      monthlyRevenue: 2500,
      assignedEditor: ob.assignedEditor || EDITORS[0].id,
      assignedSocialManager: ob.assignedSocialManager || "sm1",
      week: assignedWeek,
      status: "active",
      contactEmail: ob.contactEmail,
      phone: ob.phone,
      package: ob.package,
      notes: ob.notes,
      graduatedFrom: ob.id,
    };
    setClients((prev) => [...prev, newClient]);
    setOnboardingClients((prev) => prev.filter((c) => c.id !== ob.id));
  }, [clients]);

  /* ─── Derived counts ─── */
  const approvalCount = videos.filter((v) => v.editingStatus === "delivered").length;

  if (!user) return <LoginPage onLogin={setUser} users={users} />;

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <DashboardPage clients={clients} videos={videos} leads={leads} ads={ads} />;
      case "calendar":
        return <CalendarPage clients={clients} videos={videos} />;
      case "sales":
        return <SalesPage leads={leads} setLeads={setLeads} onClosedWon={handleClosedWon} canDelete={canDelete} />;
      case "onboarding":
        return (
          <OnboardingPage
            onboardingClients={onboardingClients}
            setOnboardingClients={setOnboardingClients}
            onMoveToProduction={handleMoveToProduction}
            canDelete={canDelete}
          />
        );
      case "clients":
        return <ClientsPage clients={clients} setClients={setClients} canDelete={canDelete} />;
      case "production":
        return <ProductionPage clients={clients} videos={videos} setVideos={setVideos} />;
      case "approvals":
        return <ApprovalsPage videos={videos} setVideos={setVideos} userName={user.name} />;
      case "publishing":
        return <PublishingPage videos={videos} setVideos={setVideos} />;
      case "editors":
        return <EditorsPage videos={videos} />;
      case "ads":
        return <AdsPage ads={ads} setAds={setAds} clients={clients} canDelete={canDelete} />;
      case "packages":
        return <PackagesPage />;
      case "knowledge":
        return <KnowledgePage canDelete={canDelete} />;
      case "activity":
        return <ActivityPage />;
      case "users":
        return isSuperAdminUser ? <UsersPage users={users} setUsers={setUsers} /> : <DashboardPage clients={clients} videos={videos} leads={leads} ads={ads} />;
      default:
        return <DashboardPage clients={clients} videos={videos} leads={leads} ads={ads} />;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif", color: "var(--text)", background: "var(--bg)" }}>
      <Sidebar
        currentPage={page}
        onNavigate={setPage}
        userName={user.name}
        approvalCount={approvalCount}
        onSignOut={() => setUser(null)}
        videos={videos}
        leads={leads}
        clients={clients}
        ads={ads}
      />
      <div style={{ flex: 1, padding: page === "knowledge" ? 0 : "40px 56px", overflowY: "auto", minHeight: "100vh" }}>
        {renderPage()}
      </div>
    </div>
  );
}
