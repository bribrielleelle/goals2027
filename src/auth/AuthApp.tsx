import {
  ClerkProvider,
  Show,
  SignIn,
  SignUp,
  useAuth,
  useClerk,
  useUser,
} from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { PlannerWorkspaceApp } from '../App';
import { deleteAccount } from '../lib/workspaceApi';
import { pendingCalendarInvite, rememberCalendarInvite } from '../lib/calendarInvitation';

rememberCalendarInvite();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY for Clerk authentication.');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#DB4F88',
    colorForeground: '#2A2226',
    colorMutedForeground: '#786870',
    colorDanger: '#B42318',
    colorBackground: '#FFFFFF',
    colorInput: '#FFFBFD',
    colorInputForeground: '#2A2226',
    colorNeutral: '#2A2226',
    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    borderRadius: '0.875rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox:
      'bg-white rounded-3xl w-[440px] max-w-full overflow-hidden border border-[#F2DCE5] shadow-xl',
    card: '!bg-transparent !shadow-none !border-0 !rounded-none',
    footer: '!bg-transparent !shadow-none !border-0 !rounded-none',
    headerTitle: 'font-bold text-[#2A2226]',
    headerSubtitle: 'text-[#786870]',
    socialButtonsBlockButtonText: 'font-medium text-[#2A2226]',
    formFieldLabel: 'font-medium text-[#2A2226]',
    footerActionLink: 'font-semibold text-[#B73570]',
    footerActionText: 'text-[#786870]',
    dividerText: 'text-[#786870]',
    identityPreviewEditButton: 'font-medium text-[#B73570]',
    formFieldSuccessText: 'text-emerald-700',
    alertText: 'text-[#B42318]',
    logoBox: 'h-12 w-12',
    logoImage: 'rounded-xl',
    socialButtonsBlockButton: 'rounded-xl border-[#F2DCE5]',
    formButtonPrimary: 'rounded-xl font-semibold',
    formFieldInput: 'rounded-xl border-[#F2DCE5] bg-[#FFFBFD] text-[#2A2226]',
    footerAction: 'text-sm',
    dividerLine: 'bg-[#F2DCE5]',
    alert: 'rounded-xl border border-rose-200 bg-rose-50',
    otpCodeFieldInput: 'rounded-xl border-[#F2DCE5]',
    formFieldRow: 'gap-1.5',
    main: 'gap-5',
  },
};

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

function PublicLanding() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fff8fb] text-[#2A2226]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-10">
        <Link to="/" className="flex items-center gap-3">
          <img src={`${basePath}/logo.svg`} alt="" className="h-11 w-11 rounded-2xl" />
          <span className="font-display text-lg font-bold">Komorebi Studio</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            to="/sign-in"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-[#8D345B] transition-colors hover:bg-[#FCEAF1]"
          >
            Sign in
          </Link>
          <Link
            to="/sign-up"
            className="rounded-xl bg-[#DB4F88] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#C83F78]"
          >
            Create account
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-12 sm:px-10 lg:grid-cols-[1fr_0.9fr] lg:py-24">
        <div className="max-w-2xl">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#F2DCE5] bg-white/80 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-[#A93C6D]">
            A softer space for your plans
          </p>
          <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
            Make room for what matters to you.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#786870] sm:text-lg">
            Build a personal planner at your own pace. Start with a clean,
            empty workspace, then add only the pages and goals you choose.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/sign-up"
              className="rounded-2xl bg-[#DB4F88] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[#DB4F88]/20 transition hover:-translate-y-0.5 hover:bg-[#C83F78]"
            >
              Create your free workspace
            </Link>
            <Link
              to="/sign-in"
              className="rounded-2xl border border-[#F2DCE5] bg-white px-6 py-3 text-sm font-semibold text-[#8D345B] transition hover:bg-[#fff1f6]"
            >
              I already have an account
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -left-8 top-10 h-40 w-40 rounded-full bg-[#F7D5E4] blur-3xl" />
          <div className="absolute -right-5 bottom-6 h-48 w-48 rounded-full bg-[#E5EEDF] blur-3xl" />
          <div className="relative rounded-[2rem] border border-[#F2DCE5] bg-white/90 p-6 shadow-[0_30px_90px_-45px_rgba(169,60,109,0.35)] sm:p-9">
            <div className="flex items-center gap-3 border-b border-[#F2DCE5] pb-5">
              <img src={`${basePath}/logo.svg`} alt="" className="h-10 w-10 rounded-xl" />
              <div>
                <p className="text-sm font-bold">Your workspace</p>
                <p className="mt-0.5 text-xs text-[#786870]">A fresh start, every time</p>
              </div>
            </div>
            <div className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FCEAF1] text-3xl">
                ✨
              </div>
              <h2 className="mt-5 font-display text-xl font-bold">A clean page to begin</h2>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#786870]">
                No pre-filled goals or pages. Your ideas make this space yours.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['Daily', 'Goals', 'Journal'].map((label) => (
                <div
                  key={label}
                  className="rounded-xl border border-dashed border-[#EED2DF] bg-[#FFFBFD] px-3 py-4 text-center text-xs font-medium text-[#9B8790]"
                >
                  {label}
                  <span className="mt-1 block text-[10px]">Add when ready</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#fff8fb] px-4 py-10">
      <SignIn
        forceRedirectUrl={pendingCalendarInvite() ? `${basePath}/app?calendarInvite=${pendingCalendarInvite()}` : undefined}
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#fff8fb] px-4 py-10">
      <SignUp
        forceRedirectUrl={pendingCalendarInvite() ? `${basePath}/app?calendarInvite=${pendingCalendarInvite()}` : undefined}
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
      />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/app" />
      </Show>
      <Show when="signed-out">
        <PublicLanding />
      </Show>
    </>
  );
}

function accountInitials(name: string): string {
  return (
    name
      .trim()
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'K'
  );
}

function AuthenticatedPlanner() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fff8fb] text-sm text-[#786870]">
        Checking your account…
      </main>
    );
  }

  if (!userId) return <Redirect to="/" />;

  const name =
    user?.fullName ||
    user?.firstName ||
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    'Your';

  return (
    <PlannerWorkspaceApp
      key={userId}
      userId={userId}
      accountName={name}
      accountInitials={accountInitials(name)}
      onSignOut={() => void signOut({ redirectUrl: basePath || '/' })}
      onDeleteAccount={async () => {
        await deleteAccount();
        window.location.replace(basePath || '/');
      }}
    />
  );
}

function UserPortal() {
  return (
    <>
      <Show when="signed-in">
        <AuthenticatedPlanner />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkAppRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: 'Welcome back',
            subtitle: 'Sign in to return to your planner',
          },
        },
        signUp: {
          start: {
            title: 'Create your account',
            subtitle: 'Start with a fresh, personal workspace',
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/app" component={UserPortal} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
      </Switch>
    </ClerkProvider>
  );
}

export default function AuthApp() {
  return (
    <WouterRouter base={basePath}>
      <ClerkAppRoutes />
    </WouterRouter>
  );
}
