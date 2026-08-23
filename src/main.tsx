import ReactDOM from 'react-dom/client'
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router'
import './styles.css'
import { AppProviders } from './AppProviders'
import StatusPage from '@/routes/StatusPage'
import HomePage from '@/routes/HomePage'
import MerchantPayPage from '@/routes/MerchantPayPage'
import CustomerProfilePage from '@/routes/CustomerProfilePage'
import MemberRegisterPage from '@/routes/MemberRegisterPage'
import CheckoutPage from '@/routes/CheckoutPage'
import PaymentSuccessPage from '@/routes/PaymentSuccessPage'
import PaymentCancelPage from '@/routes/PaymentCancelPage'
import SuperAdminLoginPage from '@/routes/admin/SuperAdminLoginPage'
import SuperAdminDashboardPage from '@/routes/admin/SuperAdminDashboardPage'
import MerchantsPage from '@/routes/admin/MerchantsPage'
import MerchantDetailPage from '@/routes/admin/MerchantDetailPage'
import AdminPayoutsPage from '@/routes/admin/AdminPayoutsPage'
import AdminBillsPage from '@/routes/admin/AdminBillsPage'
import AdminCustomerPaymentsPage from '@/routes/admin/AdminCustomerPaymentsPage'
import AdminMembersPage from '@/routes/admin/AdminMembersPage'
import SuperAdminAnalyticsPage from '@/routes/admin/SuperAdminAnalyticsPage'
import AdminAuditLogsPage from '@/routes/admin/AdminAuditLogsPage'
import SuperAdminSettingsPage from '@/routes/admin/SuperAdminSettingsPage'
import MerchantLoginPage from '@/routes/admin/MerchantLoginPage'
import MerchantDashboardPage from '@/routes/admin/MerchantDashboardPage'
import MembersPage from '@/routes/admin/MembersPage'
import GenerateBillsPage from '@/routes/admin/GenerateBillsPage'
import TrackerPage from '@/routes/admin/TrackerPage'
import PaymentsPage from '@/routes/admin/PaymentsPage'
import ManualPaymentPage from '@/routes/admin/ManualPaymentPage'
import AccountingPage from '@/routes/admin/AccountingPage'
import AnalyticsPage from '@/routes/admin/AnalyticsPage'
import SettingsPage from '@/routes/admin/SettingsPage'
import MerchantPlanPage from '@/routes/admin/MerchantPlanPage'
import MerchantPlanCheckoutPage from '@/routes/admin/MerchantPlanCheckoutPage'
import { adminAuthService } from '@/services/adminAuthService'
import { merchantAuthService } from '@/services/merchantAuthService'
import {
  merchantHasPlanFeature,
  type MerchantPlanFeature,
} from '@/lib/merchantPlan'
import reportWebVitals from './reportWebVitals'

document.title = 'iLPay - i Will Pay'

const requireSuperAdmin = () => {
  if (!adminAuthService.isAuthenticated()) {
    throw redirect({ to: '/admin/super/login' })
  }
}

const requireMerchant = () => {
  if (!merchantAuthService.isAuthenticated()) {
    throw redirect({ to: '/admin/login' })
  }
}

const requireMerchantFeature = (feature: MerchantPlanFeature) => () => {
  requireMerchant()
  if (!merchantHasPlanFeature(merchantAuthService.getPlan(), feature)) {
    throw redirect({ to: '/admin/dashboard' })
  }
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const merchantPayRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pay/$merchantCode',
  component: MerchantPayPage,
})

const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/account',
  validateSearch: (search: Record<string, unknown>) => ({
    account:
      typeof search.account === 'string' ? search.account.trim() : undefined,
    paid: typeof search.paid === 'string' ? search.paid.trim() : undefined,
  }),
  component: CustomerProfilePage,
})

const memberRegisterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register/$merchantCode',
  component: MemberRegisterPage,
})

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  validateSearch: (search: Record<string, unknown>) => ({
    account:
      typeof search.account === 'string' ? search.account.trim() : undefined,
    bill: typeof search.bill === 'string' ? search.bill.trim() : undefined,
  }),
  component: CheckoutPage,
})

const paymentSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payment/success/$paymentUuid',
  validateSearch: (search: Record<string, unknown>) => ({
    account:
      typeof search.account === 'string' ? search.account.trim() : undefined,
  }),
  component: PaymentSuccessPage,
})

const paymentCancelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payment/cancel/$paymentUuid',
  validateSearch: (search: Record<string, unknown>) => ({
    account:
      typeof search.account === 'string' ? search.account.trim() : undefined,
  }),
  component: PaymentCancelPage,
})

const statusRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/status',
  component: StatusPage,
})

const merchantLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/login',
  beforeLoad: () => {
    if (merchantAuthService.isAuthenticated()) {
      throw redirect({ to: '/admin/dashboard' })
    }
  },
  component: MerchantLoginPage,
})

const merchantDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/dashboard',
  beforeLoad: requireMerchant,
  component: MerchantDashboardPage,
})

const merchantCustomersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/member',
  beforeLoad: requireMerchantFeature('members'),
  component: MembersPage,
})

const merchantCustomersLegacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/customers',
  beforeLoad: () => {
    throw redirect({ to: '/admin/member' })
  },
  component: MembersPage,
})

const merchantGenerateBillsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/generate-bills',
  beforeLoad: requireMerchantFeature('generate_bills'),
  component: GenerateBillsPage,
})

const merchantTrackerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/tracker',
  beforeLoad: requireMerchantFeature('tracker'),
  component: TrackerPage,
})

const merchantPaymentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/payments',
  beforeLoad: requireMerchantFeature('payments'),
  component: PaymentsPage,
})

const merchantManualPaymentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/manual-payments',
  beforeLoad: requireMerchantFeature('manual_payment'),
  component: ManualPaymentPage,
})

const merchantAccountingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/accounting',
  beforeLoad: requireMerchantFeature('accounting'),
  component: AccountingPage,
})

const merchantAnalyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/analytics',
  beforeLoad: requireMerchantFeature('analytics'),
  component: AnalyticsPage,
})

const merchantPlanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/plan',
  beforeLoad: requireMerchant,
  validateSearch: (search: Record<string, unknown>) => ({
    payment:
      typeof search.payment === 'string' ? search.payment.trim() : undefined,
    status:
      typeof search.status === 'string' ? search.status.trim() : undefined,
  }),
  component: MerchantPlanPage,
})

const merchantPlanCheckoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/plan/checkout',
  beforeLoad: requireMerchant,
  validateSearch: (search: Record<string, unknown>) => ({
    kind:
      typeof search.kind === 'string' ? search.kind.trim() : undefined,
    plan: typeof search.plan === 'string' ? search.plan.trim() : undefined,
  }),
  component: MerchantPlanCheckoutPage,
})

const merchantSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/settings',
  beforeLoad: requireMerchant,
  component: SettingsPage,
})

const superAdminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/super/login',
  beforeLoad: () => {
    if (adminAuthService.isAuthenticated()) {
      throw redirect({ to: '/admin/super/dashboard' })
    }
  },
  component: SuperAdminLoginPage,
})

const superAdminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/super/dashboard',
  beforeLoad: requireSuperAdmin,
  component: SuperAdminDashboardPage,
})

const superAdminMerchantsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/super/merchants',
  beforeLoad: requireSuperAdmin,
  component: MerchantsPage,
})

const superAdminMerchantDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/super/merchants/$uuid',
  beforeLoad: requireSuperAdmin,
  component: MerchantDetailPage,
})

const superAdminPayoutsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/super/payouts',
  beforeLoad: requireSuperAdmin,
  component: AdminPayoutsPage,
})

const superAdminBillsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/super/bills',
  beforeLoad: requireSuperAdmin,
  component: AdminBillsPage,
})

const superAdminCustomerPaymentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/super/customer-payments',
  beforeLoad: requireSuperAdmin,
  component: AdminCustomerPaymentsPage,
})

const superAdminMembersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/super/members',
  beforeLoad: requireSuperAdmin,
  component: AdminMembersPage,
})

const superAdminAnalyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/super/analytics',
  beforeLoad: requireSuperAdmin,
  component: SuperAdminAnalyticsPage,
})

const superAdminAuditLogsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/super/audit-logs',
  beforeLoad: requireSuperAdmin,
  component: AdminAuditLogsPage,
})

const superAdminSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/super/settings',
  beforeLoad: requireSuperAdmin,
  component: SuperAdminSettingsPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  merchantPayRoute,
  accountRoute,
  memberRegisterRoute,
  checkoutRoute,
  paymentSuccessRoute,
  paymentCancelRoute,
  statusRoute,
  merchantLoginRoute,
  merchantDashboardRoute,
  merchantCustomersRoute,
  merchantCustomersLegacyRoute,
  merchantGenerateBillsRoute,
  merchantTrackerRoute,
  merchantPaymentsRoute,
  merchantManualPaymentsRoute,
  merchantAccountingRoute,
  merchantAnalyticsRoute,
  merchantPlanRoute,
  merchantPlanCheckoutRoute,
  merchantSettingsRoute,
  superAdminLoginRoute,
  superAdminDashboardRoute,
  superAdminMerchantsRoute,
  superAdminMerchantDetailRoute,
  superAdminPayoutsRoute,
  superAdminBillsRoute,
  superAdminMembersRoute,
  superAdminCustomerPaymentsRoute,
  superAdminAnalyticsRoute,
  superAdminAuditLogsRoute,
  superAdminSettingsRoute,
])

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
}

reportWebVitals()
