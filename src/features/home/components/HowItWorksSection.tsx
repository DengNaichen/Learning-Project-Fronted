import FeatureCard from "./FeatureCard";

export default function HowItWorksSection() {
  return (
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
        <FeatureCard
          icon="edit_square"
          title="1. Create Your Graph"
          description="Start with a single idea. Our intuitive editor makes it easy to add concepts, connect nodes, and build a visual map of your knowledge."
        />
        <FeatureCard
          icon="explore"
          title="2. Explore & Conquer"
          description="Navigate your graph like a world map. Unlock new areas as you master topics, coloring the map with your progress and revealing the bigger picture."
        />
        <FeatureCard
          icon="share"
          title="3. Share & Collaborate"
          description="Ready to share your creation? Invite others to view your graph or collaborate, building a shared library of knowledge together. (Coming Soon)"
        />
      </div>
    </section>
  );
}
