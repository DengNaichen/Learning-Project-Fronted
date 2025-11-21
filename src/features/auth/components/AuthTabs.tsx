interface AuthTabsProps {
  activeTab: "login" | "signup";
  onTabChange: (tab: "login" | "signup") => void;
}

export function AuthTabs({ activeTab, onTabChange }: AuthTabsProps) {
  return (
    <div className="flex px-4 py-3">
      <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-slate-200 p-1 dark:bg-slate-800">
        <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 has-[:checked]:bg-white has-[:checked]:shadow-[0_0_4px_rgba(0,0,0,0.1)] has-[:checked]:text-[#111318] text-[#616f89] dark:has-[:checked]:bg-slate-950 dark:has-[:checked]:text-white dark:text-slate-400 text-sm font-medium leading-normal">
          <span className="truncate">Log In</span>
          <input
            className="invisible w-0"
            name="auth-toggle"
            type="radio"
            value="login"
            checked={activeTab === "login"}
            onChange={() => onTabChange("login")}
          />
        </label>
        <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 has-[:checked]:bg-white has-[:checked]:shadow-[0_0_4px_rgba(0,0,0,0.1)] has-[:checked]:text-[#111318] text-[#616f89] dark:has-[:checked]:bg-slate-950 dark:has-[:checked]:text-white dark:text-slate-400 text-sm font-medium leading-normal">
          <span className="truncate">Sign Up</span>
          <input
            className="invisible w-0"
            name="auth-toggle"
            type="radio"
            value="signup"
            checked={activeTab === "signup"}
            onChange={() => onTabChange("signup")}
          />
        </label>
      </div>
    </div>
  );
}
