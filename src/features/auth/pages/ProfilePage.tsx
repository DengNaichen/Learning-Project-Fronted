import { useAuth } from "../AuthContext";
import { Navbar } from "../../../components/layout/Navbar";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const name = user.user_metadata?.name || user.email || "User";
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
          <div className="flex flex-col items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-bold">
              {initials}
            </div>

            {/* User Info */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
                {name}
              </h1>
              <p className="text-text-secondary dark:text-text-secondary-dark mt-1">
                {user.email}
              </p>
            </div>

            {/* Actions */}
            <div className="w-full max-w-xs mt-4">
              <button
                onClick={logout}
                className="btn-secondary btn-lg w-full"
              >
                <span className="truncate">Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
