interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="card flex flex-col items-center text-center gap-4 p-6">
      <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 dark:bg-primary/20 text-primary">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <h3 className="text-xl font-bold text-text-primary dark:text-text-primary-dark">{title}</h3>
      <p className="text-text-secondary dark:text-text-secondary-dark">
        {description}
      </p>
    </div>
  );
}
