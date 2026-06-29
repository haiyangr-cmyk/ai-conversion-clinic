"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "./lib/analytics";

function getLinkTarget(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof Element)) return null;
  return target.closest("a");
}

function getText(element: Element | null) {
  return element?.textContent?.replace(/\s+/g, " ").trim().slice(0, 100) || "";
}

export default function AnalyticsEvents() {
  const pathname = usePathname();
  const limitTrackedRef = useRef(false);

  useEffect(() => {
    if (pathname === "/report") {
      trackEvent("report_viewed", { path: pathname });
    }

    if (pathname === "/checkout") {
      trackEvent("checkout_viewed", { path: pathname });
    }
  }, [pathname]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const link = getLinkTarget(event.target);
      if (!link) return;

      const href = link.getAttribute("href") || "";
      const text = getText(link);
      const currentPath = window.location.pathname;

      let url: URL | null = null;

      try {
        url = new URL(link.href, window.location.href);
      } catch {
        url = null;
      }

      if (href.includes("#audit-form")) {
        trackEvent("audit_form_cta_click", {
          source_path: currentPath,
          link_text: text,
        });
      }

      if (url && url.origin !== window.location.origin) {
        trackEvent("external_tool_click", {
          source_path: currentPath,
          link_text: text,
          outbound_domain: url.hostname,
        });
        return;
      }

      if (!url) return;

      if (url.pathname === "/sample-report") {
        trackEvent("sample_report_click", {
          source_path: currentPath,
          link_text: text,
        });
      }

      if (url.pathname === "/tools") {
        trackEvent("tools_click", {
          source_path: currentPath,
          link_text: text,
        });
      }

      if (url.pathname === "/blog") {
        trackEvent("blog_click", {
          source_path: currentPath,
          link_text: text,
        });
      }

      if (url.pathname === "/checkout") {
        trackEvent("checkout_click", {
          source_path: currentPath,
          link_text: text,
        });
      }
    }

    function handleSubmit(event: SubmitEvent) {
      const form = event.target;

      if (!(form instanceof HTMLFormElement)) return;

      const auditSection = document.querySelector("#audit-form");
      const isAuditForm =
        auditSection?.contains(form) ||
        Boolean(form.querySelector('input[name="url"], input[type="url"], textarea'));

      if (!isAuditForm) return;

      trackEvent("diagnosis_form_submit", {
        source_path: window.location.pathname,
      });
    }

    function checkLimitError() {
      if (limitTrackedRef.current) return;

      const errorText = Array.from(document.querySelectorAll(".form-error"))
        .map((node) => node.textContent || "")
        .join(" ");

      if (errorText.includes("free diagnosis limit")) {
        limitTrackedRef.current = true;
        trackEvent("diagnosis_limit_reached", {
          source_path: window.location.pathname,
        });
      }
    }

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);

    const observer = new MutationObserver(checkLimitError);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    checkLimitError();

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
      observer.disconnect();
    };
  }, []);

  return null;
}
