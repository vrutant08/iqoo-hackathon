"use client";

import { Architecture } from "./architecture";
import { Compare } from "./compare";
import { DemoProvider } from "./demo-context";
import { DemoStage } from "./demo-stage";
import { Engines } from "./engines";
import { Footer } from "./footer";
import { Header } from "./header";
import { Hero } from "./hero";
import { Stack } from "./stack";

export function HomePage() {
  return (
    <DemoProvider>
      <div className="min-h-screen overflow-x-hidden bg-paper text-ink">
        <Header />
        <main>
          <Hero />
          <DemoStage />
          <Engines />
          <Compare />
          <Architecture />
          <Stack />
        </main>
        <Footer />
      </div>
    </DemoProvider>
  );
}
