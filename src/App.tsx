import * as React from "react"
import { renderAsync } from "docx-preview"
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom"
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileText,
  Filter,
  FolderKanban,
  LayoutDashboard,
  LibraryBig,
  ListChecks,
  LockKeyhole,
  MessageSquareText,
  Moon,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  Sparkles,
  Sun,
  UploadCloud,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

type PolicyStatus = "Processing" | "Ready for Review" | "Published"
type RefStatus = "Needs Review" | "Reviewed" | "Review Not Required"
type ChangeStatus = "Changed" | "Unchanged" | "Added" | "Deleted"
type RuleDiffStatus = "Modified" | "Added" | "Deleted" | "Unchanged"
type PolicyType = "Group Policy" | "Country Addenda"
type Country = "India" | "Singapore" | "Hong Kong"

type PolicyRef = {
  id: string
  ruleCount: number
  summary: string
  changeStatus: ChangeStatus
  status: RefStatus
  segment?: string
}

type Policy = {
  id: string
  policyType: PolicyType
  scope: Country | "Group"
  documentName: string
  version: string
  uploadedDate: string
  publishedDate?: string
  status: PolicyStatus
  refs: PolicyRef[]
}

type NewPolicyInput = {
  policyType: PolicyType
  scope: Country | "Group"
  documentName: string
  version: string
}

const seedPolicies: Policy[] = [
  {
    id: "singapore-addenda-v4",
    policyType: "Country Addenda",
    scope: "Singapore",
    documentName: "Singapore Banking Addenda.docx",
    version: "4.0",
    uploadedDate: "May 20, 2026",
    status: "Ready for Review",
    refs: [
      {
        id: "A-001",
        ruleCount: 44,
        summary:
          "Customer onboarding requirements for Singapore-specific due diligence, consent capture, and records retention.",
        changeStatus: "Changed",
        status: "Needs Review",
      },
      {
        id: "B-002",
        ruleCount: 28,
        summary:
          "Disclosure, transaction monitoring, and evidence handling expectations for regulated client activity.",
        changeStatus: "Unchanged",
        status: "Review Not Required",
      },
      {
        id: "C-003",
        ruleCount: 16,
        summary:
          "Escalation and exception governance for high-risk account maintenance scenarios.",
        changeStatus: "Added",
        status: "Needs Review",
      },
    ],
  },
  {
    id: "group-client-policy-v4",
    policyType: "Group Policy",
    scope: "Group",
    documentName: "Group Client Policy.docx",
    version: "4.0",
    uploadedDate: "May 18, 2026",
    status: "Ready for Review",
    refs: [
      {
        id: "IND-001",
        ruleCount: 39,
        summary:
          "Baseline eligibility, onboarding, and service controls for individual clients.",
        changeStatus: "Unchanged",
        status: "Review Not Required",
        segment: "Individual",
      },
      {
        id: "CLB-002",
        ruleCount: 21,
        summary:
          "Membership verification and operating mandates for clubs and associations.",
        changeStatus: "Changed",
        status: "Needs Review",
        segment: "Club",
      },
    ],
  },
]

const stats = [
  {
    label: "Active policies",
    value: "148",
    change: "+8 this quarter",
    icon: FileText,
  },
  {
    label: "Awaiting approval",
    value: "23",
    change: "6 due today",
    icon: Clock3,
  },
  {
    label: "Coverage score",
    value: "94%",
    change: "+3.2% vs last month",
    icon: Activity,
  },
  {
    label: "Open exceptions",
    value: "11",
    change: "2 high priority",
    icon: AlertTriangle,
  },
]

const reviewQueue = [
  {
    title: "Vendor Risk Management Policy",
    owner: "Procurement",
    status: "Legal review",
    due: "Today",
    tone: "bg-amber-500",
  },
  {
    title: "Data Retention Standard",
    owner: "Privacy Office",
    status: "Control mapping",
    due: "Tomorrow",
    tone: "bg-blue-500",
  },
  {
    title: "Incident Response Playbook",
    owner: "Security",
    status: "Executive sign-off",
    due: "May 24",
    tone: "bg-emerald-500",
  },
  {
    title: "Acceptable Use Policy",
    owner: "IT Operations",
    status: "Employee attestation",
    due: "May 29",
    tone: "bg-violet-500",
  },
]

const lifecycle = [
  { label: "Draft", count: 18, icon: FileText },
  { label: "Review", count: 23, icon: MessageSquareText },
  { label: "Approved", count: 91, icon: CheckCircle2 },
  { label: "Published", count: 148, icon: BookOpenCheck },
]

const frameworks = [
  { name: "ISO 27001", coverage: 96 },
  { name: "SOC 2", coverage: 91 },
  { name: "HIPAA", coverage: 87 },
]

const countries: Country[] = ["India", "Singapore", "Hong Kong"]

function App() {
  const [policies, setPolicies] = React.useState<Policy[]>(seedPolicies)
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [notice, setNotice] = React.useState("")

  const addPolicy = React.useCallback((input: NewPolicyInput) => {
    const newPolicy: Policy = {
      id: `policy-${Date.now()}`,
      policyType: input.policyType,
      scope: input.scope,
      documentName: input.documentName,
      version: input.version,
      uploadedDate: new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
      status: "Processing",
      refs: [],
    }

    setPolicies((current) => [newPolicy, ...current])
    setNotice("Policy add request initiated. Processing is in progress.")
    window.setTimeout(() => setNotice(""), 4200)
  }, [])

  const markRefReviewed = React.useCallback((policyId: string, refId: string) => {
    setPolicies((current) =>
      current.map((policy) => {
        if (policy.id !== policyId) {
          return policy
        }

        return {
          ...policy,
          refs: policy.refs.map((ref) =>
            ref.id === refId ? { ...ref, status: "Reviewed" } : ref
          ),
        }
      })
    )
  }, [])

  const publishPolicy = React.useCallback((policyId: string) => {
    setPolicies((current) =>
      current.map((policy) =>
        policy.id === policyId
          ? {
              ...policy,
              publishedDate: new Intl.DateTimeFormat("en", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }).format(new Date()),
              status: "Published",
            }
          : policy
      )
    )
    setNotice("Policy published successfully.")
    window.setTimeout(() => setNotice(""), 4200)
  }, [])

  return (
    <BrowserRouter>
      <AppShell
        isAddOpen={isAddOpen}
        notice={notice}
        onAddPolicy={addPolicy}
        onOpenAddPolicy={() => setIsAddOpen(true)}
        onCloseAddPolicy={() => setIsAddOpen(false)}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Overview />} />
          <Route
            path="/policies"
            element={<PolicyLibrary policies={policies} />}
          />
          <Route
            path="/policies/:policyId"
            element={
              <PolicyDetail
                policies={policies}
                onPublishPolicy={publishPolicy}
              />
            }
          />
          <Route
            path="/policies/:policyId/refs/:refId"
            element={
              <PolicyRefDetail
                policies={policies}
                onMarkReviewed={markRefReviewed}
              />
            }
          />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}

function AppShell({
  children,
  isAddOpen,
  notice,
  onAddPolicy,
  onCloseAddPolicy,
  onOpenAddPolicy,
}: {
  children: React.ReactNode
  isAddOpen: boolean
  notice: string
  onAddPolicy: (input: NewPolicyInput) => void
  onCloseAddPolicy: () => void
  onOpenAddPolicy: () => void
}) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="grid min-h-svh lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
          <div className="flex h-16 items-center gap-3 border-b px-5">
            <div className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <ShieldCheck className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                Policy Managment Studio
              </p>
              <p className="text-xs text-muted-foreground">Governance suite</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            <SideNavLink to="/overview" icon={LayoutDashboard} label="Overview" />
            <SideNavLink to="/policies" icon={LibraryBig} label="Policy Library" />
          </nav>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-20 flex min-h-16 flex-wrap items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground lg:hidden">
                <ShieldCheck className="size-5" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold md:text-lg">
                  Policy Managment Studio
                </h1>
                <p className="hidden text-xs text-muted-foreground sm:block">
                  Policy ingestion, review, rules, and publishing
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              aria-label="Toggle theme"
              onClick={() => setTheme(isDark ? "light" : "dark")}
            >
              {isDark ? <Sun /> : <Moon />}
            </Button>
            <Button onClick={onOpenAddPolicy}>
              <Plus />
              New policy
            </Button>
          </header>

          <div className="border-b px-4 py-2 lg:hidden">
            <div className="flex gap-2">
              <TopNavLink to="/overview" label="Overview" />
              <TopNavLink to="/policies" label="Policy Library" />
            </div>
          </div>

          {notice ? (
            <div className="border-b bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 md:px-6">
              {notice}
            </div>
          ) : null}

          {children}
        </main>
      </div>

      <AddPolicySheet
        isOpen={isAddOpen}
        onAddPolicy={onAddPolicy}
        onClose={onCloseAddPolicy}
      />
    </div>
  )
}

function SideNavLink({
  icon: Icon,
  label,
  to,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  to: string
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-sm transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
        )
      }
    >
      <Icon className="size-4" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </NavLink>
  )
}

function TopNavLink({ label, to }: { label: string; to: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "rounded-md px-3 py-1.5 text-sm",
          isActive
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )
      }
    >
      {label}
    </NavLink>
  )
}

function Overview() {
  return (
    <PageFrame>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-normal">
                  {stat.value}
                </p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <stat.icon className="size-4" />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{stat.change}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.45fr_0.9fr]">
        <div className="rounded-lg border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
            <div>
              <h2 className="text-sm font-semibold">Review queue</h2>
              <p className="text-xs text-muted-foreground">
                Work moving through policy approval this week
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Filter />
                Filter
              </Button>
              <Button variant="outline" size="icon" aria-label="More">
                <MoreHorizontal />
              </Button>
            </div>
          </div>

          <div className="divide-y">
            {reviewQueue.map((item) => (
              <div
                key={item.title}
                className="grid gap-3 p-4 sm:grid-cols-[1fr_150px_100px] sm:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className={cn("size-2.5 rounded-full", item.tone)} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Owner: {item.owner}
                    </p>
                  </div>
                </div>
                <span className="w-fit rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                  {item.status}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:justify-end">
                  <CalendarClock className="size-3.5" />
                  {item.due}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Policy lifecycle</h2>
              <p className="text-xs text-muted-foreground">
                Current document state
              </p>
            </div>
            <FolderKanban className="size-5 text-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {lifecycle.map((stage) => (
              <div key={stage.label} className="rounded-md border p-3">
                <stage.icon className="mb-3 size-4 text-primary" />
                <p className="text-xl font-semibold">{stage.count}</p>
                <p className="text-xs text-muted-foreground">{stage.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr_0.8fr]">
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Framework coverage</h2>
            <LockKeyhole className="size-4 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            {frameworks.map((framework) => (
              <div key={framework.name}>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span>{framework.name}</span>
                  <span className="text-muted-foreground">
                    {framework.coverage}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${framework.coverage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">AI policy assistant</h2>
            <Sparkles className="size-4 text-primary" />
          </div>
          <div className="rounded-md border bg-muted/30 p-4">
            <p className="text-sm font-medium">
              Suggested updates for Q3 regulatory changes
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Three privacy policies reference retired retention language.
              Draft replacements are ready for owner review.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button>Review drafts</Button>
              <Button variant="outline">Dismiss</Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Today</h2>
            <ListChecks className="size-4 text-muted-foreground" />
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-4 text-emerald-500" />
              <p>Board policy pack exported</p>
            </div>
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 size-4 text-amber-500" />
              <p>Six attestations need reminders</p>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-4 text-red-500" />
              <p>One overdue exception review</p>
            </div>
          </div>
        </div>
      </section>
    </PageFrame>
  )
}

function PolicyLibrary({ policies }: { policies: Policy[] }) {
  return (
    <PageFrame>
      <PageHeader
        title="Policy Library"
        description="Uploaded group policies and country addenda moving through AI processing and review."
        breadcrumbs={[{ label: "Policy Library" }]}
      />

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Policy Type</th>
                <th className="px-4 py-3 font-medium">Country / Scope</th>
                <th className="px-4 py-3 font-medium">Document Name</th>
                <th className="px-4 py-3 font-medium">Version</th>
                <th className="px-4 py-3 font-medium">Uploaded Date</th>
                <th className="px-4 py-3 font-medium">Published Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {policies.map((policy) => (
                <tr key={policy.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">{policy.policyType}</td>
                  <td className="px-4 py-3">{policy.scope}</td>
                  <td className="px-4 py-3 font-medium">
                    {policy.documentName}
                  </td>
                  <td className="px-4 py-3">{policy.version}</td>
                  <td className="px-4 py-3">{policy.uploadedDate}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {policy.publishedDate ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={policy.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {policy.status === "Processing" ? (
                      <Button variant="outline" disabled>
                        Processing
                      </Button>
                    ) : (
                      <Button asChild variant="outline">
                        <Link to={`/policies/${policy.id}`}>
                          Open
                          <ChevronRight />
                        </Link>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageFrame>
  )
}

function PolicyDetail({
  onPublishPolicy,
  policies,
}: {
  policies: Policy[]
  onPublishPolicy: (policyId: string) => void
}) {
  const { policyId } = useParams()
  const policy = policies.find((item) => item.id === policyId)

  if (!policy) {
    return <MissingPolicy />
  }

  const allReviewed =
    policy.refs.length > 0 &&
    policy.refs.every((ref) => ref.status !== "Needs Review")

  return (
    <PageFrame>
      <PageHeader
        backTo="/policies"
        title={policy.documentName}
        description={`${policy.policyType} ${policy.version} for ${policy.scope}`}
        breadcrumbs={[
          { label: "Policy Library", to: "/policies" },
          { label: policy.documentName },
        ]}
        action={
          <Button
            disabled={!allReviewed || policy.status === "Published"}
            onClick={() => onPublishPolicy(policy.id)}
          >
            <ClipboardCheck />
            {policy.status === "Published" ? "Published" : "Publish Policy"}
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard label="Policy Type" value={policy.policyType} />
        <SummaryCard label="Country / Scope" value={policy.scope} />
        <SummaryCard label="Status" value={<StatusBadge status={policy.status} />} />
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b p-4">
          <h2 className="text-sm font-semibold">
            {policy.policyType === "Group Policy"
              ? "Client segments"
              : "Policy references"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {policy.policyType === "Group Policy"
              ? "Review grouped rule sets by client segment before publishing."
              : "Compare extracted policy chunks against the previous published version."}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="w-40 px-4 py-3 font-medium">
                  {policy.policyType === "Group Policy"
                    ? "Client Segment"
                    : "Policy Ref"}
                </th>
                <th className="w-20 px-4 py-3 font-medium">Diff</th>
                <th className="px-4 py-3 font-medium">No. of Rules</th>
                <th className="px-4 py-3 font-medium">Policy Summary</th>
                <th className="px-4 py-3 font-medium">Review</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {policy.refs.map((ref) => (
                <tr key={ref.id} className="hover:bg-muted/30">
                  <td className="w-40 whitespace-nowrap px-4 py-3 font-medium">
                    {policy.policyType === "Group Policy" ? ref.segment : ref.id}
                  </td>
                  <td className="w-20 px-4 py-3">
                    <ChangeStatusBadge status={ref.changeStatus} />
                  </td>
                  <td className="px-4 py-3">{ref.ruleCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ref.summary}
                  </td>
                  <td className="px-4 py-3">
                    <RefStatusBadge status={ref.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="outline">
                      <Link to={`/policies/${policy.id}/refs/${ref.id}`}>
                        Open
                        <ChevronRight />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageFrame>
  )
}

function PolicyRefDetail({
  onMarkReviewed,
  policies,
}: {
  policies: Policy[]
  onMarkReviewed: (policyId: string, refId: string) => void
}) {
  const { policyId, refId } = useParams()
  const policy = policies.find((item) => item.id === policyId)
  const ref = policy?.refs.find((item) => item.id === refId)
  const [tab, setTab] = React.useState<"rules" | "text" | "summary">("rules")

  if (!policy || !ref) {
    return <MissingPolicy />
  }

  const detailTitle =
    policy.policyType === "Group Policy" ? (ref.segment ?? ref.id) : ref.id

  return (
    <PageFrame>
      <PageHeader
        backTo={`/policies/${policy.id}`}
        title={detailTitle}
        description={ref.summary}
        breadcrumbs={[
          { label: "Policy Library", to: "/policies" },
          { label: policy.documentName, to: `/policies/${policy.id}` },
          { label: detailTitle },
        ]}
        action={
          <Button
            disabled={ref.status !== "Needs Review"}
            onClick={() => onMarkReviewed(policy.id, ref.id)}
          >
            <CheckCircle2 />
            {ref.status === "Review Not Required"
              ? "Review Not Required"
              : ref.status === "Reviewed"
                ? "Reviewed"
                : "Mark Reviewed"}
          </Button>
        }
      />

      <div className="rounded-lg border bg-card">
        <div className="flex gap-1 border-b p-2">
          <TabButton active={tab === "rules"} onClick={() => setTab("rules")}>
            Rules
          </TabButton>
          <TabButton active={tab === "text"} onClick={() => setTab("text")}>
            Policy Text
          </TabButton>
          <TabButton
            active={tab === "summary"}
            onClick={() => setTab("summary")}
          >
            AI Summary
          </TabButton>
        </div>
        <div className="p-4">
          {tab === "rules" ? <RulesTable refId={ref.id} /> : null}
          {tab === "text" ? <PolicyText refId={ref.id} /> : null}
          {tab === "summary" ? <AiSummary refId={ref.id} /> : null}
        </div>
      </div>
    </PageFrame>
  )
}

function AddPolicySheet({
  isOpen,
  onAddPolicy,
  onClose,
}: {
  isOpen: boolean
  onAddPolicy: (input: NewPolicyInput) => void
  onClose: () => void
}) {
  const navigate = useNavigate()
  const [policyType, setPolicyType] =
    React.useState<PolicyType>("Country Addenda")
  const [country, setCountry] = React.useState<Country>("Singapore")
  const [version, setVersion] = React.useState("4.0")
  const [file, setFile] = React.useState<File | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  function resetForm() {
    setPolicyType("Country Addenda")
    setCountry("Singapore")
    setVersion("4.0")
    setFile(null)
    setIsUploading(false)
    setProgress(0)
  }

  function requestClose() {
    if (isUploading) {
      return
    }

    onClose()
    resetForm()
  }

  function chooseFile(nextFile?: File) {
    if (!nextFile) {
      return
    }

    setFile(nextFile)
  }

  function submitPolicy() {
    if (!file || isUploading) {
      return
    }

    setIsUploading(true)
    setProgress(18)

    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(current + 18, 92))
    }, 240)

    window.setTimeout(() => {
      window.clearInterval(timer)
      setProgress(100)
      onAddPolicy({
        policyType,
        scope: policyType === "Group Policy" ? "Group" : country,
        documentName: file.name,
        version,
      })
      onClose()
      resetForm()
      navigate("/policies")
    }, 1600)
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 animate-in fade-in bg-background/70 backdrop-blur-sm duration-150"
        onClick={requestClose}
      />
      <section
        className={cn(
          "absolute right-0 top-0 flex h-full animate-in flex-col border-l bg-background shadow-2xl fade-in slide-in-from-right-8 duration-200",
          file ? "w-[min(64rem,100vw)]" : "w-[min(30rem,100vw)]"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-policy-title"
      >
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 id="add-policy-title" className="text-base font-semibold">
              Add policy
            </h2>
            <p className="text-sm text-muted-foreground">
              Upload a policy document for mock AI processing.
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Close"
            disabled={isUploading}
            onClick={requestClose}
          >
            <X />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {file ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB detected as Word
                      document
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    disabled={isUploading}
                    onClick={() => setFile(null)}
                  >
                    Clear document
                  </Button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <ReadOnlyMeta label="Document Type" value={policyType} />
                  <ReadOnlyMeta
                    label="Country"
                    value={policyType === "Group Policy" ? "Group" : country}
                  />
                  <ReadOnlyMeta label="Version" value={version} />
                </div>
              </div>

              <div className="rounded-lg border bg-card p-4">
                <DocxPreview file={file} />
              </div>

              {isUploading ? (
                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span>Uploading policy</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="max-w-md space-y-5">
                <Field label="Document Type">
                  <div className="relative">
                    <select
                      className="h-9 w-full appearance-none rounded-md border bg-background px-3 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                      disabled={isUploading}
                      value={policyType}
                      onChange={(event) =>
                        setPolicyType(event.target.value as PolicyType)
                      }
                    >
                      <option value="Group Policy">Group Policy</option>
                      <option value="Country Addenda">Country Addenda</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </Field>

                {policyType === "Country Addenda" ? (
                  <Field label="Country">
                    <div className="relative">
                      <select
                        className="h-9 w-full appearance-none rounded-md border bg-background px-3 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                        disabled={isUploading}
                        value={country}
                        onChange={(event) =>
                          setCountry(event.target.value as Country)
                        }
                      >
                        {countries.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </Field>
                ) : null}

                <Field label="Version">
                  <input
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                    disabled={isUploading}
                    value={version}
                    onChange={(event) => setVersion(event.target.value)}
                  />
                </Field>

                <Field label="Policy Document">
                  <div
                    className="rounded-lg border border-dashed bg-muted/20 p-5 text-center"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      chooseFile(event.dataTransfer.files[0])
                    }}
                  >
                    <UploadCloud className="mx-auto mb-3 size-8 text-primary" />
                    <p className="text-sm font-medium">
                      Drag and drop a Word document
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Supports .docx for this prototype
                    </p>
                    <Button
                      className="mt-4"
                      disabled={isUploading}
                      type="button"
                      variant="outline"
                      onClick={() => inputRef.current?.click()}
                    >
                      Choose file
                    </Button>
                    <input
                      ref={inputRef}
                      className="hidden"
                      type="file"
                      accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(event) => chooseFile(event.target.files?.[0])}
                    />
                  </div>
                </Field>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t p-4">
          <Button variant="outline" disabled={isUploading} onClick={requestClose}>
            Cancel
          </Button>
          <Button disabled={!file || isUploading} onClick={submitPolicy}>
            Add Policy
          </Button>
        </div>
      </section>
    </div>
  )
}

function PageFrame({ children }: { children: React.ReactNode }) {
  return <div className="space-y-5 p-4 md:p-6">{children}</div>
}

function DocxPreview({ file }: { file: File }) {
  const previewRef = React.useRef<HTMLDivElement>(null)
  const styleRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const preview = previewRef.current
    const style = styleRef.current

    if (!preview || !style) {
      return
    }

    let cancelled = false
    preview.replaceChildren("Rendering document preview...")
    style.replaceChildren()

    renderAsync(file, preview, style, {
      breakPages: true,
      className: "docx-preview",
      experimental: true,
      ignoreFonts: true,
      inWrapper: true,
      renderHeaders: true,
      renderFooters: true,
    }).catch(() => {
      if (cancelled) {
        return
      }

      preview.replaceChildren(
        "Could not render this document preview. Please choose a valid .docx file."
      )
    })

    return () => {
      cancelled = true
      preview.replaceChildren()
      style.replaceChildren()
    }
  }, [file])

  return (
    <>
      <div ref={styleRef} />
      <div className="docx-preview-frame" ref={previewRef} />
    </>
  )
}

function PageHeader({
  action,
  backTo,
  breadcrumbs,
  description,
  title,
}: {
  action?: React.ReactNode
  backTo?: string
  breadcrumbs: { label: string; to?: string }[]
  description: string
  title: string
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={`${crumb.label}-${index}`}>
            {crumb.to ? (
              <Link className="hover:text-foreground" to={crumb.to}>
                {crumb.label}
              </Link>
            ) : (
              <span className="text-foreground">{crumb.label}</span>
            )}
            {index < breadcrumbs.length - 1 ? (
              <ChevronRight className="size-3" />
            ) : null}
          </React.Fragment>
        ))}
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {backTo ? (
            <Button asChild variant="outline" size="icon" aria-label="Back">
              <Link to={backTo}>
                <ArrowLeft />
              </Link>
            </Button>
          ) : null}
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold">{title}</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        {action}
      </div>
    </div>
  )
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode
  label: string
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </div>
  )
}

function ReadOnlyMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  )
}

function SummaryCard({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-2 text-sm font-medium">{value}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: PolicyStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-1 text-xs font-medium",
        status === "Processing" &&
          "bg-amber-500/10 text-amber-700 dark:text-amber-300",
        status === "Ready for Review" &&
          "bg-blue-500/10 text-blue-700 dark:text-blue-300",
        status === "Published" &&
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      )}
    >
      {status}
    </span>
  )
}

function RefStatusBadge({ status }: { status: RefStatus }) {
  const label =
    status === "Needs Review"
      ? "Required"
      : status === "Review Not Required"
        ? "Not required"
        : "Reviewed"

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center whitespace-nowrap rounded px-2 text-xs font-medium",
        status === "Needs Review" &&
          "bg-amber-500/10 text-amber-700 dark:text-amber-300",
        status === "Reviewed" &&
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        status === "Review Not Required" && "bg-muted text-muted-foreground"
      )}
    >
      {label}
    </span>
  )
}

function ChangeStatusBadge({ status }: { status: ChangeStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center whitespace-nowrap rounded px-2 text-xs font-medium",
        status === "Changed" &&
          "bg-blue-500/10 text-blue-700 dark:text-blue-300",
        status === "Unchanged" &&
          "bg-muted text-muted-foreground",
        status === "Added" &&
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        status === "Deleted" &&
          "bg-red-500/10 text-red-700 dark:text-red-300"
      )}
      title={status}
    >
      {status}
    </span>
  )
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      className={cn(
        "rounded-md px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

function RulesTable({ refId }: { refId: string }) {
  const [expandedRule, setExpandedRule] = React.useState(`${refId}-R01`)
  const rules = [
    {
      id: `${refId}-R01`,
      diff: "Modified" as const,
      applies: "Onboarding",
      segment: "Retail",
      version: "KYC-4.0",
      attribute: "Identity verification and risk rating",
      documents: "Passport, proof of address, CRS form",
      changes: [
        {
          field: "Applicable ID & V",
          before: "KYC-3.0",
          after: "KYC-4.0",
        },
        {
          field: "Attribute",
          before: "Identity verification",
          after: "Identity verification and risk rating",
        },
        {
          field: "Documents",
          before: "Passport, proof of address",
          after: "Passport, proof of address, CRS form",
        },
      ],
    },
    {
      id: `${refId}-R02`,
      diff: "Added" as const,
      applies: "Account maintenance",
      segment: "Priority",
      version: "AML-4.0",
      attribute: "Risk refresh",
      documents: "Client profile, risk score",
    },
    {
      id: `${refId}-R03`,
      diff: "Deleted" as const,
      applies: "Periodic review",
      segment: "Corporate",
      version: "DOC-3.0",
      attribute: "Manual evidence retention",
      documents: "Board extract, ownership chart",
    },
    {
      id: `${refId}-R04`,
      diff: "Unchanged" as const,
      applies: "Periodic review",
      segment: "Corporate",
      version: "DOC-4.0",
      attribute: "Evidence retention",
      documents: "Board extract, ownership chart",
    },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="border-b text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Rule Ref</th>
            <th className="px-3 py-2 font-medium">Applicable For</th>
            <th className="px-3 py-2 font-medium">Client Segment</th>
            <th className="px-3 py-2 font-medium">Applicable ID & V</th>
            <th className="px-3 py-2 font-medium">Attribute</th>
            <th className="px-3 py-2 font-medium">Documents</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rules.map((rule) => (
            <React.Fragment key={rule.id}>
              <tr
                className={cn(
                  "border-l-2",
                  rule.diff === "Modified" &&
                    "border-l-blue-500 bg-blue-500/[0.03]",
                  rule.diff === "Added" &&
                    "border-l-emerald-500 bg-emerald-500/[0.03]",
                  rule.diff === "Deleted" &&
                    "border-l-red-500 bg-red-500/[0.03]",
                  rule.diff === "Unchanged" && "border-l-transparent"
                )}
              >
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    {rule.diff === "Modified" ? (
                      <button
                        className="flex size-6 items-center justify-center rounded-md border hover:bg-muted"
                        type="button"
                        aria-label={`${expandedRule === rule.id ? "Collapse" : "Expand"} ${rule.id} diff`}
                        onClick={() =>
                          setExpandedRule((current) =>
                            current === rule.id ? "" : rule.id
                          )
                        }
                      >
                        {expandedRule === rule.id ? (
                          <ChevronDown className="size-3.5" />
                        ) : (
                          <ChevronRight className="size-3.5" />
                        )}
                      </button>
                    ) : (
                      <span className="size-6" />
                    )}
                    <div>
                      <p
                        className={cn(
                          "font-medium",
                          rule.diff === "Deleted" &&
                            "text-muted-foreground line-through"
                        )}
                      >
                        {rule.id}
                      </p>
                      <RuleDiffBadge status={rule.diff} />
                    </div>
                  </div>
                </td>
                <td
                  className={cn(
                    "px-3 py-3",
                    rule.diff === "Deleted" &&
                      "text-muted-foreground line-through"
                  )}
                >
                  {rule.applies}
                </td>
                <td
                  className={cn(
                    "px-3 py-3",
                    rule.diff === "Deleted" &&
                      "text-muted-foreground line-through"
                  )}
                >
                  {rule.segment}
                </td>
                <td
                  className={cn(
                    "px-3 py-3",
                    rule.diff === "Deleted" &&
                      "text-muted-foreground line-through"
                  )}
                >
                  {rule.version}
                </td>
                <td
                  className={cn(
                    "px-3 py-3",
                    rule.diff === "Deleted" &&
                      "text-muted-foreground line-through"
                  )}
                >
                  {rule.attribute}
                </td>
                <td
                  className={cn(
                    "px-3 py-3 text-muted-foreground",
                    rule.diff === "Deleted" && "line-through"
                  )}
                >
                  {rule.documents}
                </td>
              </tr>
              {rule.diff === "Modified" && expandedRule === rule.id ? (
                <tr>
                  <td colSpan={6} className="bg-muted/20 px-3 py-3">
                    <div className="ml-8 rounded-md border bg-background">
                      {rule.changes.map((change) => (
                        <div
                          key={change.field}
                          className="grid gap-2 border-b p-3 last:border-b-0 md:grid-cols-[180px_1fr]"
                        >
                          <p className="text-xs font-medium text-muted-foreground">
                            {change.field}
                          </p>
                          <div className="space-y-1 font-mono text-xs">
                            <p className="rounded bg-red-500/10 px-2 py-1 text-red-700 line-through dark:text-red-300">
                              - {change.before}
                            </p>
                            <p className="rounded bg-emerald-500/10 px-2 py-1 text-emerald-700 dark:text-emerald-300">
                              + {change.after}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ) : null}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RuleDiffBadge({ status }: { status: RuleDiffStatus }) {
  return (
    <span
      className={cn(
        "mt-1 inline-flex h-5 items-center whitespace-nowrap rounded px-1.5 text-[0.6875rem] font-medium",
        status === "Modified" &&
          "bg-blue-500/10 text-blue-700 dark:text-blue-300",
        status === "Added" &&
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        status === "Deleted" && "bg-red-500/10 text-red-700 dark:text-red-300",
        status === "Unchanged" && "bg-muted text-muted-foreground"
      )}
    >
      {status}
    </span>
  )
}

function PolicyText({ refId }: { refId: string }) {
  return (
    <article className="max-w-3xl space-y-4 text-sm leading-7">
      <h2 className="text-lg font-semibold">Policy Text: {refId}</h2>
      <p>
        The bank must apply enhanced review to all client records that match the
        applicable jurisdiction, client segment, product type, and risk
        classification described in this section.
      </p>
      <p>
        Relationship managers must ensure that required evidence is complete,
        current, and retained in the approved document repository before a client
        account is activated or materially changed.
      </p>
      <h3 className="text-base font-semibold">Operational Requirements</h3>
      <p>
        Exceptions require documented business justification, compliance
        approval, and a target remediation date. Open exceptions must be reviewed
        at least every thirty days until closure.
      </p>
    </article>
  )
}

function AiSummary({ refId }: { refId: string }) {
  return (
    <article className="max-w-4xl space-y-4 text-sm leading-7">
      <h2 className="text-lg font-semibold">AI Summary: {refId}</h2>
      <p>
        This section generates rules for onboarding, maintenance, risk refresh,
        and document retention. The highest operational impact is evidence
        completeness before account activation.
      </p>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Theme</th>
              <th className="px-3 py-2 font-medium">Impact</th>
              <th className="px-3 py-2 font-medium">Suggested Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr>
              <td className="px-3 py-3">Evidence</td>
              <td className="px-3 py-3">High</td>
              <td className="px-3 py-3">Validate mandatory documents</td>
            </tr>
            <tr>
              <td className="px-3 py-3">Exceptions</td>
              <td className="px-3 py-3">Medium</td>
              <td className="px-3 py-3">Create recurring review task</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  )
}

function MissingPolicy() {
  return (
    <PageFrame>
      <PageHeader
        backTo="/policies"
        title="Policy not found"
        description="The selected mock policy is no longer available in memory."
        breadcrumbs={[{ label: "Policy Library", to: "/policies" }]}
      />
    </PageFrame>
  )
}

export default App
