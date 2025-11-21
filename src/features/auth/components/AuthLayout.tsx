import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-bg dark:bg-bg-dark">
      <div className="flex h-full grow flex-col">
        <div className="flex flex-1 justify-center">
          <div className="flex flex-col w-full flex-1">
            <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
              {/* Left Panel: Branding & Value Proposition */}
              <div className="relative hidden flex-col justify-between p-8 text-text-primary dark:text-text-primary-dark lg:flex">
                <a className="z-10 flex items-center gap-2 text-xl font-bold" href="/">
                  <span className="material-symbols-outlined text-primary text-3xl">share</span>
                  <span>KnowledgeGraph</span>
                </a>

                <div className="z-10 flex flex-col gap-6">
                  <div className="flex flex-col gap-2 text-left">
                    <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] lg:text-5xl">
                      Connect, Collaborate, and Map Your Knowledge
                    </h1>
                    <h2 className="text-text-secondary dark:text-text-secondary-dark text-base font-normal leading-normal">
                      Unlock the power of community-driven knowledge graphs. Join us to build and explore the future of collaborative learning.
                    </h2>
                  </div>
                </div>

                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                  <div
                    className="h-full w-full bg-center bg-no-repeat bg-cover opacity-10"
                    style={{
                      backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDPEd_8C2rXPV7kRUfvVFkE1A3vePDgMINcrFoXCf1-_jixGia_APjVivjjeY1zMtUELSo5cX_s7yGrFyFcAssGSyDl8P16wUFZLaMsHOZJWgr9z6OmBHQz5ipXIElNzndur60g4gbcskcsf0XZNOQut7G9rVCumg-2vLN2cTNhtPhF-HBerS3TcVADV3CU8V7EssvjrJO-WHIeUdQJOj7QoJ1ve0itk8Ee8-RtAwEzGL3sSM_JQ-5GYGkkE0tUv59Q0tIqUIfTSN0")'
                    }}
                  />
                </div>
              </div>

              {/* Right Panel: Form Content */}
              <div className="flex w-full items-center justify-center p-4 sm:p-8 bg-bg-elevated dark:bg-bg-elevated-dark">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
