import React from "react";
import Navbar from "../Navbar";
import Footer from "../Footer";

interface LayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

export default function Layout({ children, sidebar }: LayoutProps) {
  return (
    <>
      <Navbar />
      <section className="section">
        <div className="container">
          {sidebar ? (
            <div className="columns">
              <div className="column is-3">
                <aside className="menu">{sidebar}</aside>
              </div>
              <div className="column is-9">{children}</div>
            </div>
          ) : (
            <div className="columns is-centered">
              <div className="column is-10">{children}</div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
