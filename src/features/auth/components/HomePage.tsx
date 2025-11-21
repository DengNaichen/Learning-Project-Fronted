import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="page-container">
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col w-full max-w-6xl flex-1 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-border dark:border-border-dark bg-bg-elevated/80 dark:bg-bg-elevated-dark/80 backdrop-blur-sm sticky top-4 z-10 rounded-lg px-6 py-3">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3 text-text-primary dark:text-text-primary-dark">
                  <div className="text-primary size-7">
                    <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21.219 22c0 0-3.182-5.048.813-10-2.822-5.528.98-10 .98-10l-17.709.01S2.52 7.058-2.094 12.01C-6.052 16.952.135 22 .135 22l21.084-.001z"></path>
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold tracking-[-0.015em]">KnowledgeHub</h2>
                </div>
                <div className="hidden md:flex items-center gap-9">
                  <a className="nav-link" href="#how-it-works">
                    How It Works
                  </a>
                  <a className="nav-link" href="#features">
                    Features
                  </a>
                  <Link to="/graphs" className="nav-link">
                    Explore
                  </Link>
                </div>
              </div>
              <div className="flex flex-1 justify-end gap-3 items-center">
                <Link to="/login" className="btn-secondary btn-md">
                  Log In
                </Link>
                <Link to="/register" className="btn-primary btn-md">
                  Sign Up
                </Link>
              </div>
            </header>

            {/* Main Content */}
            <main className="mt-8 flex flex-col gap-12">
              {/* Hero Section */}
              <section className="flex flex-col gap-8 text-center items-center py-16 md:py-24">
                <div className="flex flex-col gap-4 items-center">
                  <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] md:text-6xl max-w-3xl text-text-primary dark:text-text-primary-dark">
                    Unlock Knowledge, Visually.
                  </h1>
                  <p className="text-lg font-normal leading-normal text-text-secondary dark:text-text-secondary-dark max-w-2xl">
                    Transform learning into an adventure. Build, explore, and conquer interconnected knowledge graphs in a gamified experience like no other.
                  </p>
                </div>
                <div className="flex-wrap gap-4 flex justify-center">
                  <Link to="/register" className="btn-primary btn-lg">
                    <span className="truncate">Start Creating Your Graph</span>
                  </Link>
                  <Link
                    to="/graphs"
                    className="btn-secondary btn-lg border border-border dark:border-border-dark"
                  >
                    <span className="truncate">Explore Sample Graphs</span>
                  </Link>
                </div>
                <div
                  className="w-full max-w-4xl mt-8 bg-center bg-no-repeat aspect-video bg-cover rounded-xl shadow-2xl"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCp3pL0KNOW3aSHycsk_qq7IcZRqorHgKkKGp285qYrrEykQsOG0gX1wtyXjoALDrv-P9DhIhrLFluSzu1Be4ez9FkpTZ6k__bJOiA3ayEDrlnb4Qdi64NM8vMIPpCZqnV2HV2ipjV581TLrlXRfHDIBtmrTYhIZpVRg1vV52-pNiTNQLdydpRxezKrJFMVbyg8wGWL6uXeckyjbvGw8yzulViQ5OEthZCHAe3VLEoFMSETWu6Mj0tejLZ3EHuhok0nK9ZnxfLjERM')",
                  }}
                  role="img"
                  aria-label="An abstract visualization of a colorful, interconnected knowledge graph"
                ></div>
              </section>

              {/* How It Works Section */}
              <section id="how-it-works" className="py-16 md:py-24 space-y-12">
                <div className="flex flex-col gap-4 text-center items-center">
                  <h2 className="text-3xl font-bold leading-tight tracking-[-0.015em] md:text-4xl text-text-primary dark:text-text-primary-dark">
                    How It Works
                  </h2>
                  <p className="text-lg font-normal leading-normal text-text-secondary dark:text-text-secondary-dark max-w-2xl">
                    Your journey from novice to master in three simple steps.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="card flex flex-col items-center text-center gap-4 p-6">
                    <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 dark:bg-primary/20 text-primary">
                      <span className="material-symbols-outlined text-3xl">edit_square</span>
                    </div>
                    <h3 className="text-xl font-bold text-text-primary dark:text-text-primary-dark">1. Create Your Graph</h3>
                    <p className="text-text-secondary dark:text-text-secondary-dark">
                      Start with a single idea. Our intuitive editor makes it easy to add concepts, connect nodes, and build a visual map of your knowledge.
                    </p>
                  </div>
                  <div className="card flex flex-col items-center text-center gap-4 p-6">
                    <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 dark:bg-primary/20 text-primary">
                      <span className="material-symbols-outlined text-3xl">explore</span>
                    </div>
                    <h3 className="text-xl font-bold text-text-primary dark:text-text-primary-dark">2. Explore &amp; Conquer</h3>
                    <p className="text-text-secondary dark:text-text-secondary-dark">
                      Navigate your graph like a world map. Unlock new areas as you master topics, coloring the map with your progress and revealing the bigger picture.
                    </p>
                  </div>
                  <div className="card flex flex-col items-center text-center gap-4 p-6">
                    <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 dark:bg-primary/20 text-primary">
                      <span className="material-symbols-outlined text-3xl">share</span>
                    </div>
                    <h3 className="text-xl font-bold text-text-primary dark:text-text-primary-dark">3. Share &amp; Collaborate</h3>
                    <p className="text-text-secondary dark:text-text-secondary-dark">
                      Ready to share your creation? Invite others to view your graph or collaborate, building a shared library of knowledge together. (Coming Soon)
                    </p>
                  </div>
                </div>
              </section>

              {/* Features Section */}
              <section id="features" className="py-16 md:py-24 space-y-12">
                <div className="flex flex-col gap-4 text-center items-center">
                  <h2 className="text-3xl font-bold leading-tight tracking-[-0.015em] md:text-4xl text-text-primary dark:text-text-primary-dark">
                    A Gamified Approach to Learning
                  </h2>
                  <p className="text-lg font-normal leading-normal text-text-secondary dark:text-text-secondary-dark max-w-2xl">
                    Learning shouldn't be a chore. We've integrated game mechanics to make your educational journey engaging, rewarding, and fun.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="card flex flex-col gap-4 overflow-hidden">
                    <div
                      className="w-full bg-center bg-no-repeat aspect-video bg-cover"
                      style={{
                        backgroundImage:
                          "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCz71xe6RObomVMuNUmz6RKYCKfNA5bcFr6MSOk8ALlg2_VgjioH7jKotzg-3xIa1qjpav2vdLIqpuxJXeNy9t5U8vgbrGX-Hw3qk2biq4QsRCpYAuYjFyLe0A5vT5PCMUE-vKLctBPYmO4yJ5plAH8QnrdDx3fLQo3aM1zHvy6CBFrunxBJ4ZfjYgPaJg2wo9t1jXeLcLwE1ee6jgt8Ti7SU7lazQ_E0MoIxH1CSNQhOvuhTn-bOuaCklvsdWS4TClTRb9QbIINEc')",
                      }}
                      role="img"
                      aria-label="Stylized map with unlocked sections"
                    ></div>
                    <div className="p-6 flex flex-col gap-2">
                      <h3 className="text-xl font-bold text-text-primary dark:text-text-primary-dark">Zelda-Style Map Unlocking</h3>
                      <p className="text-text-secondary dark:text-text-secondary-dark">
                        Venture into the unknown. As you learn new topics, the fog of war recedes, revealing interconnected concepts and new paths to explore.
                      </p>
                    </div>
                  </div>
                  <div className="card flex flex-col gap-4 overflow-hidden">
                    <div
                      className="w-full bg-center bg-no-repeat aspect-video bg-cover"
                      style={{
                        backgroundImage:
                          "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBe-Hv9qVW-sazrvMqVtOf07GU-PmAtVDIAB4DRPpxbFkTwTKBEeV-sW7vz7zU1_MbHKwQR5eK7hRJnQNPH_Xk5ay2WaDTzChQew0mjXXKJJXC9UP8QLRCtpljc9-lrYw8uxzYkY4loANfj8bCsCZ7tn-XfEkZc2AMu74FmaYqTN4gJZhA0tDUCdUZ35DlXBHapSSLyzTp-y53FGqC5rYlaEYmsWBsIxYVRXwdkROAgKwy8ZDMFK983y-YPZdfueUNhxO3I4WTMGK4')",
                      }}
                      role="img"
                      aria-label="A colorful map being painted"
                    ></div>
                    <div className="p-6 flex flex-col gap-2">
                      <h3 className="text-xl font-bold text-text-primary dark:text-text-primary-dark">Splatoon-Style Coloring</h3>
                      <p className="text-text-secondary dark:text-text-secondary-dark">
                        Claim your territory of knowledge! Mark nodes as 'mastered' to color them in, creating a vibrant visual testament to your progress.
                      </p>
                    </div>
                  </div>
                  <div className="card flex flex-col gap-4 overflow-hidden md:col-span-2 lg:col-span-1">
                    <div
                      className="w-full bg-center bg-no-repeat aspect-video bg-cover"
                      style={{
                        backgroundImage:
                          "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDXr-e_YnJ2YscBj6XXORxSnSAKmPrQXZOS0hsOV-h3F016MKcwFOpG0ZBP3y6Ex8DE5fDY6falIca5jxcTJYr0s6siqxbc3NM7V0wO_MNG9ihimWa0mvEYG1S4apBjtYEAKt70LoJPwCt1yRRvs5o5umCA6OkLWxijaDz4opJYKQt2vhUcOEALjJ_5tvYjAY9Tr_qJT-f5G-v9Nv2abZ0m4kVz0GSFNeyeUSEtHT8WrJIeQAho6YouTmfvToN8o0jbakvKA2Wma-Y')",
                      }}
                      role="img"
                      aria-label="A glowing tower overlooking a map"
                    ></div>
                    <div className="p-6 flex flex-col gap-2">
                      <h3 className="text-xl font-bold text-text-primary dark:text-text-primary-dark">Sky View Towers</h3>
                      <p className="text-text-secondary dark:text-text-secondary-dark">
                        Gain a new perspective. Activate key nodes to reveal entire sub-sections of your knowledge graph, helping you see the big picture.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* CTA Section */}
              <section className="my-16 md:my-24">
                <div className="relative flex flex-col items-center justify-center gap-6 p-8 md:p-12 rounded-xl bg-primary/10 dark:bg-primary/20 text-center overflow-hidden">
                  <div className="absolute -bottom-1/2 -right-1/4 size-[400px] text-primary/10 dark:text-primary/20">
                    <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21.219 22c0 0-3.182-5.048.813-10-2.822-5.528.98-10 .98-10l-17.709.01S2.52 7.058-2.094 12.01C-6.052 16.952.135 22 .135 22l21.084-.001z"></path>
                    </svg>
                  </div>
                  <div className="relative z-10 flex flex-col items-center gap-6">
                    <h2 className="text-3xl font-bold leading-tight tracking-[-0.015em] md:text-4xl max-w-2xl text-text-primary dark:text-text-primary-dark">
                      Ready to Start Your Adventure?
                    </h2>
                    <p className="text-lg font-normal leading-normal text-text-secondary dark:text-text-secondary-dark max-w-xl">
                      Create your first knowledge graph for free. No credit card required. Begin mapping your mind and transforming the way you learn, today.
                    </p>
                    <Link to="/register" className="btn-primary btn-lg mt-2">
                      <span className="truncate">Start Creating for Free</span>
                    </Link>
                  </div>
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
