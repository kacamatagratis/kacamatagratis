import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

export const dynamic = "force-dynamic";

/**
 * Firestore Schema for landing_page_settings collection:
 *
 * - hero (document):
 *   { heading: string, description: string, youtube_url: string }
 *
 * - value_proposition (document):
 *   {
 *     before_title: string,
 *     before_items: string[],
 *     after_title: string,
 *     after_items: string[]
 *   }
 *
 * - why_section (document):
 *   {
 *     title: string,
 *     items: Array<{ text: string }>
 *   }
 *
 * - statistics (document):
 *   {
 *     stats: Array<{ number: string, label: string, description: string }>
 *   }
 *
 * - program (document):
 *   {
 *     content_type: 'video' | 'images',
 *     video_url?: string,
 *     image_urls?: string[],
 *     title: string,
 *     items: string[]
 *   }
 *
 * - roles (document):
 *   {
 *     title: string,
 *     items: Array<{
 *       title: string,
 *       description: string,
 *       whatsapp_number: string,
 *       whatsapp_message: string
 *     }>
 *   }
 *
 * - testimonials (collection):
 *   Each document: { name: string, location: string, rating: number, text: string, order: number }
 *
 * - faq (collection):
 *   Each document: { question: string, answer: string, order: number }
 *
 * - media_coverage (collection):
 *   Each document: { location: string, title: string, url: string, source: string, image_url?: string, order: number }
 */

export async function GET() {
  try {
    const settingsRef = collection(db, "landing_page_settings");

    // Fetch all document-based settings
    const [hero, valueProposition, whySection, statistics, program, roles] =
      await Promise.all([
        getDoc(doc(settingsRef, "hero")),
        getDoc(doc(settingsRef, "value_proposition")),
        getDoc(doc(settingsRef, "why_section")),
        getDoc(doc(settingsRef, "statistics")),
        getDoc(doc(settingsRef, "program")),
        getDoc(doc(settingsRef, "roles")),
      ]);

    // Fetch collection-based settings
    const testimonialsSnap = await getDocs(
      collection(db, "landing_page_settings", "testimonials", "items")
    );
    const faqSnap = await getDocs(
      collection(db, "landing_page_settings", "faq", "items")
    );
    const mediaCoverageSnap = await getDocs(
      collection(db, "landing_page_settings", "media_coverage", "items")
    );

    // Transform collections to arrays and sort by order
    const testimonials = testimonialsSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    const faq = faqSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    const mediaCoverage = mediaCoverageSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    return NextResponse.json({
      success: true,
      data: {
        hero: hero.exists() ? hero.data() : null,
        value_proposition: valueProposition.exists()
          ? valueProposition.data()
          : null,
        why_section: whySection.exists() ? whySection.data() : null,
        statistics: statistics.exists() ? statistics.data() : null,
        program: program.exists() ? program.data() : null,
        roles: roles.exists() ? roles.data() : null,
        testimonials,
        faq,
        media_coverage: mediaCoverage,
      },
    });
  } catch (error) {
    console.error("[LANDING PAGE] Error fetching data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
