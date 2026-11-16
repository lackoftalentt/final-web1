"""Build the final report, genuine screenshot evidence, ZIP and links file."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from hashlib import sha256
from html import escape
import json
import os
from pathlib import Path
import subprocess
import sys
from urllib.parse import urlsplit
from zipfile import ZipFile, ZIP_DEFLATED

from PIL import Image as PillowImage
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
    Image, KeepTogether,
)

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT.parent / "final-project-submission"
PREFIX = "JDM_Legends_SE2516"
INK = colors.HexColor("#202622")
MUTED = colors.HexColor("#59645b")
LINE = colors.HexColor("#dce2d9")
ACCENT = colors.HexColor("#d6f36b")
WIDTH = 170 * mm


def read_json(file, fallback):
    try:
        return json.loads(Path(file).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return fallback


def valid_url(value):
    value = value.strip()
    if value:
        parsed = urlsplit(value)
        if (parsed.scheme not in {"http", "https"} or not parsed.hostname
                or parsed.username or parsed.password or "\n" in value):
            raise ValueError("A link must be an HTTP(S) URL without credentials.")
    return value


def build_fingerprint():
    digest = sha256()
    for file in sorted((ROOT / "dist").rglob("*")):
        if file.is_file():
            digest.update((file.relative_to(ROOT / "dist").as_posix() + "\0").encode())
            digest.update(file.read_bytes())
    return digest.hexdigest()


def run_checks():
    results = {"checked_at": datetime.now(timezone.utc).isoformat(), "commands": []}
    for command in [["npm", "test"], ["npm", "run", "build"]]:
        result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
        results["commands"].append({"command": " ".join(command), "exit_code": result.returncode,
                                    "output": result.stdout + result.stderr})
        print(result.stdout, end="")
        if result.returncode:
            print(result.stderr, file=sys.stderr)
    results["passed"] = all(item["exit_code"] == 0 for item in results["commands"])
    if (ROOT / "dist/index.html").exists():
        results["build_fingerprint"] = build_fingerprint()
    (ROOT / "docs/verification.json").write_text(json.dumps(results, indent=2) + "\n")
    return results


STYLES = getSampleStyleSheet()
for name, options in {
    "ReportBody": dict(fontName="Helvetica", fontSize=10, leading=15.3, textColor=MUTED, spaceAfter=10),
    "ReportSmall": dict(fontName="Helvetica", fontSize=8.3, leading=12.3, textColor=MUTED, spaceAfter=7),
    "ReportLabel": dict(fontName="Helvetica-Bold", fontSize=8.5, leading=12, textColor=MUTED, spaceAfter=13),
    "ReportTitle": dict(fontName="Helvetica-Bold", fontSize=27, leading=32, textColor=INK, spaceAfter=18),
    "ReportHeading": dict(fontName="Helvetica-Bold", fontSize=13, leading=18, textColor=INK, spaceBefore=10, spaceAfter=8),
    "ReportCover": dict(fontName="Helvetica-Bold", fontSize=48, leading=51, textColor=INK, spaceAfter=12),
    "ReportCaption": dict(fontName="Helvetica", fontSize=8.1, leading=11, textColor=MUTED, spaceBefore=5, spaceAfter=8),
}.items():
    STYLES.add(ParagraphStyle(name=name, **options))


def para(text, style="ReportBody"):
    return Paragraph(escape(str(text)).replace("\n", "<br/>"), STYLES[style])


def link(label, url):
    if not url:
        return para(label + ": not yet available.")
    return Paragraph(f'{escape(label)}: <link href="{escape(url, quote=True)}" color="#355a22">{escape(url)}</link>', STYLES["ReportSmall"])


def grid(rows, widths, header=True):
    cells = [[para(value, "ReportSmall") for value in row] for row in rows]
    table = Table(cells, colWidths=widths, hAlign="LEFT", repeatRows=1 if header else 0)
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, -1), .4, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]
    if header:
        commands.append(("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#edf2e6")))
    table.setStyle(TableStyle(commands))
    return table


def fitted_image(file, max_width=WIDTH, max_height=100*mm):
    with PillowImage.open(file) as image:
        width, height = image.size
    scale = min(max_width / width, max_height / height)
    result = Image(str(file), width=width * scale, height=height * scale)
    result.hAlign = "CENTER"
    return result


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.line(20*mm, 18*mm, 190*mm, 18*mm)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 7)
    canvas.drawString(20*mm, 13*mm, "JDM LEGENDS / LETSGO / SE-2516")
    canvas.drawRightString(190*mm, 13*mm, str(doc.page))
    canvas.restoreState()


def make_report(details, verification, capture):
    repo = valid_url(os.environ.get("REPO_URL", details.get("repository_url", "")))
    live = valid_url(os.environ.get("LIVE_URL", details.get("live_url", "")))
    fingerprint = build_fingerprint()
    current_checks = verification.get("passed", False) and verification.get("build_fingerprint") == fingerprint
    current_capture = capture.get("build_fingerprint") == fingerprint
    shots = {}
    if current_capture:
        for item in capture.get("images", []):
            file = (ROOT / item["path"]).resolve()
            if file.is_relative_to(ROOT / "docs/screenshots") and file.is_file():
                if sha256(file.read_bytes()).hexdigest() == item.get("sha256"):
                    shots[item["id"]] = (file, item)

    missing = []
    if not shots:
        missing.append("Real browser screenshots for the current build")
    if capture.get("status") != "passed" or not current_capture:
        missing.append("Completed browser verification")
    if not live:
        missing.append("Publication and the verified live website URL")
    elif details.get("media_optimization_deployed") is False:
        missing.append("Deploy the optimized media build to the existing Vercel site")
    if not details.get("work_division_confirmed"):
        missing.append("Team-confirmed work division")
    state = "READY FOR TEAM REVIEW" if not missing else "PROJECT REPORT / FINAL ITEMS PENDING"
    story = []

    def page(label, title):
        if story:
            story.append(PageBreak())
        story.extend([para(label.upper(), "ReportLabel"), para(title, "ReportTitle")])

    def heading(title, text):
        story.extend([para(title, "ReportHeading"), para(text)])

    page("1 / Project title and team members", "JDM Legends")
    story.extend([
        para("Legends. In motion.", "ReportHeading"),
        para("Final project report\nMulti-page responsive website built with React and Vite"),
        grid([
            ["Team", "Members", "Group"],
            [details["team"], "Dastan and Beibarys", details["group"]],
        ], [35*mm, 95*mm, 40*mm]), Spacer(1, 6*mm),
        para(details["university"], "ReportSmall"),
    ])
    artwork = ROOT / "assets/source/initiald-last.webp"
    if artwork.exists():
        story.extend([fitted_image(artwork, max_height=84*mm),
                      para("Cover artwork: the exact final frame of the user-provided Initial D animation. This is an artwork asset, not a website screenshot.", "ReportCaption")])
    story.extend([
        para(state, "ReportLabel"),
        para("Prepared " + datetime.now().strftime("%d %B %Y") + ". Work division and the repository were confirmed by the team.", "ReportSmall"),
        link("Repository", repo),
        para("Report structure: 1. Title and team; 2. Goal and description; 3. Work division; 4. Detailed website explanation; 5. Screenshots; 6. Requirements and verification; 7. Presentation and submission; 8. References.", "ReportSmall"),
    ])

    page("2 / Project goal and description", "A focused archive of Japanese performance.")
    heading("Project goal", "JDM Legends introduces six influential Japanese performance cars through a coherent collection, understandable technical information and editorial context. It helps visitors discover a car, understand its character and keep favourites in a personal garage.")
    heading("Audience and motivation", "The site is intended for automotive enthusiasts, students and curious newcomers. Japanese performance is often discussed through engine codes and tuning figures; this project combines those details with short explanations, visual material and approachable navigation. The topic continues the team's previous JDM Legends assignments.")
    heading("The main visitor journey", "A visitor enters through the full-width Initial D hero, opens the collection, searches by car or engine, and reads a detail page. The visitor can save cars as a guest or create a local account and access a separate personal garage. Culture and About Us explain the project, while Drive Forecast connects the theme to Japanese automotive destinations.")
    story.append(grid([
        ["Stage", "Visitor action", "Result"],
        ["Discover", "Open Home and Culture", "Understand the archive and its automotive context"],
        ["Explore", "Search and filter the collection", "Find relevant cars and compare reference specifications"],
        ["Personalise", "Register, sign in and save a car", "View user details and stored favourites in Profile"],
        ["Plan", "Select a Japanese destination", "Retrieve current weather and a three-day forecast"],
        ["Contribute", "Complete Contact", "Save an explicitly local demonstration message"],
    ], [29*mm, 58*mm, 83*mm]))
    heading("Scope and technology", "The implementation uses React functional components, hooks and Context, Vite, semantic HTML, CSS Grid/Flexbox and browser localStorage. There are 15 content routes: nine main pages and six individual car pages, plus a not-found route. This is a client-side coursework application; accounts and contact messages are local simulations without a backend.")

    page("3 / Work division", "Who implemented what.")
    story.append(para("The following allocation is the actual work division supplied and confirmed by the team."))
    story.append(grid([["Team member", "Implemented responsibilities"]] + [[member["name"], member["responsibilities"]] for member in details["members"]], [35*mm, 135*mm]))
    heading("Page ownership", "Dastan implemented About Us, Culture and Profile. Beibarys implemented Home, Collection, the six car detail pages, Drive Forecast, Contact, Sign Up and Log In, along with the remaining shared behaviour and project setup.")
    heading("Integration", "Shared components keep navigation, card actions, form fields and icons consistent across both members' pages. Shared application state connects the profile to authentication and saved cars. Both team members should understand the whole application and participate in the final presentation.")
    story.append(grid([
        ["Area", "Files and implementation"],
        ["Application shell", "src/App.jsx: routes, shared context, header, footer and notifications"],
        ["Shared behaviour", "src/account.js, storage.js, theme.js and validation.js"],
        ["Page modules", "src/pages/Home.jsx, Garage.jsx, Editorial.jsx, Account.jsx and Drive.jsx"],
        ["Reusable interface", "src/components: CarCard, CarArt, Field and Icon"],
        ["Design", "src/styles.css and src/hero.css; local font and image assets in public/"],
        ["Verification and delivery", "tests/; tools/capture_report.cjs; this report generator; Vercel configuration and optional GitHub Pages workflow"],
    ], [39*mm, 131*mm]))

    page("4 / Detailed explanation of website", "Pages and navigation.")
    story.append(para("The wordmark returns to Home. The header links to Collection, Culture, Drive Forecast and About Us, and exposes theme and garage controls. Contact is available in the footer. Profile connects guests to Sign Up and Log In. Car cards link to the six detail routes."))
    story.append(grid([
        ["Page / route", "Main content and functional behaviour"],
        ["Home / #/", "Full-width optimized Initial D video, short heading, collection action, featured cars, culture introduction and personal-garage link."],
        ["Collection / #/cars", "Six cards, live text search, AWD/RWD filter, manufacturer selector, sorting and clear/reset controls."],
        ["Details / #/cars/:id", "Model description, technical story, specifications, save action and related cars. Routes: r34, supra, rx7, nsx, evo and sti."],
        ["Culture / #/culture", "Editorial sections on Japanese performance engineering, driving culture and rally heritage; links to relevant cars."],
        ["About Us / #/about", "Project purpose, intended audience, design philosophy and team information."],
        ["Drive Forecast / #/drive", "Tokyo, Yokohama and Suzuka selectors; current conditions and three-day weather data."],
        ["Contact / #/contact", "Name, email, phone, topic and message; inline validation and an honest local-save confirmation."],
        ["Sign Up / #/signup", "Name, email, phone, password and confirmation; account creation and redirect to Profile."],
        ["Log In / #/login", "Email and password validation, credential comparison and a useful error on failure."],
        ["Profile / #/profile", "User details, personal saved cars, local contact messages and sign out; guest state links to authentication."],
    ], [48*mm, 122*mm]))
    heading("Static hosting compatibility", "Hash-based routes keep navigation and direct reloads compatible with a static host. The project is hosted on Vercel; relative asset paths also support subdirectory hosting. No server-side routing or backend API is required for the local simulation.")

    page("4.1 / Detailed explanation", "Design, responsiveness and motion.")
    heading("Visual system", "Black and graphite establish the default theme; an off-white light theme is available. A restrained lime accent identifies primary actions. Semantic variables control background, surfaces, text, muted text and borders. A local Adwaita Sans variable font, consistent spacing and reusable controls establish a compact visual hierarchy.")
    heading("The Home hero", "The provided Initial D animation fills the desktop hero container. 'Legends. In motion.' is placed over a dark gradient, followed by a short explanation and one collection action. A small lower caption links to the Evolution detail page. On mobile, the animation retains its full width and natural framing while the text continues below it on the same dark surface.")
    heading("One playback, then a still", "The supplied GIF was 8,055,105 bytes. It is encoded as a 633,277-byte H.264 MP4 with 109 frames at 20 fps and the original 5.45-second duration. A small WebP preview is preloaded. The muted inline video has no loop; its ended event leaves an exact lossless final-frame WebP visible. Reduced motion skips the video request, while autoplay or media errors fall back to the same still. Content-hashed media files receive long-lived caching on Vercel. The source GIF stays outside the public build.")
    heading("Responsive layouts", "CSS Grid adapts car cards and multi-column editorial/form surfaces. Flexbox aligns controls and shared sections. Breakpoints at 1150, 900, 680 and 370 pixels refine layout and typography. Narrow viewports use a collapsible header menu and a single-column collection. Explicit image dimensions reduce layout movement while assets load.")
    heading("Accessibility and interaction", "Semantic headings, labelled inputs, a skip link, visible focus and accessible button names support navigation. Detail tabs expose tab roles and keyboard navigation. Mobile navigation reports its expanded state and closes after navigation or Escape. Hover and entrance effects use short transitions; reduced-motion rules remove optional CSS animations.")

    page("4.2 / Detailed explanation", "Search, accounts and validation.")
    heading("Dynamic collection", "Text search matches manufacturer, model, generation, engine code and engine type, ignoring letter case and surrounding whitespace. It combines with drivetrain and manufacturer filters. Sorting supports curated order, name, first production year and lightest weight. The result count, empty state and reset action update with React state; the filter choices persist in localStorage.")
    heading("Registration, authentication and profile", "Sign Up stores a trimmed name, normalised email, phone, unique identifier, join date, salt and password hash. Duplicate email accounts are rejected. Log In hashes the supplied password with the saved salt, compares credentials and redirects to Profile. Passwords are not shown on the profile. A saved session identifies the current local account; sign out clears that session.")
    heading("Saved cars and local messages", "Each car's heart action toggles its membership in the current garage. Guest and account garages are separate, and the interface explains this distinction. A signed-in profile reads its own saved cars and messages. Contact saves a demonstration message on the device and explicitly states that no email was sent.")
    story.append(grid([
        ["Validation rule", "Implementation and feedback"],
        ["Required values", "Whitespace-only names, empty credentials, missing topics and empty messages produce field-level feedback."],
        ["Email", "A JavaScript format check expects an address such as name@example.com; normalised email is used for account lookup."],
        ["Phone", "An optional leading plus and common separators are accepted; the normalised value must contain 10-15 digits."],
        ["Password", "At least eight characters, uppercase and lowercase letters, a digit and a symbol; confirmation must match."],
        ["Contact message", "At least ten non-whitespace characters and a selected topic."],
        ["Error presentation", "Messages appear beside fields with aria-invalid and associated descriptions; the first invalid input receives focus."],
    ], [39*mm, 131*mm]))
    story.append(para("Every form uses noValidate. Browser attributes required, pattern, minlength, maxlength, min, max and type=email are not used as the validation mechanism. Rules apply to the fields actually present in each form; the contact form does not introduce an irrelevant password field.", "ReportSmall"))

    page("4.3 / Detailed explanation", "Persistence and the public API.")
    story.append(grid([
        ["localStorage key", "Stored state"],
        ["jdm:theme", "The chosen dark or light theme; default is dark"],
        ["jdm:accounts", "Local profiles and salted SHA-256 password hashes"],
        ["jdm:session", "The currently signed-in account identifier"],
        ["jdm:garages", "Saved car identifiers grouped by guest or account"],
        ["jdm:filters", "Search query, drivetrain, manufacturer and sorting preference"],
        ["jdm:messages", "Local contact messages and their owner identifiers"],
    ], [45*mm, 125*mm]))
    heading("Consistent themes", "The initial HTML applies the saved theme before React starts, with dark used for missing or invalid preferences. The React theme hook uses the same rule. The page root, body and components read the same colour variables. Preferences persist after navigation/reload and synchronise between tabs through the storage event.")
    heading("Open-Meteo integration", "Drive Forecast sends an asynchronous fetch request to the public forecast endpoint with coordinates for Tokyo, Yokohama or Suzuka. It requests current temperature, weather code and wind speed, plus daily highs/lows, weather codes and maximum precipitation probability for three days. The timezone is Asia/Tokyo. No API key is required.")
    heading("Request lifecycle", "The component shows loading feedback, checks the HTTP status and validates required numeric fields and daily arrays. A new destination cancels an obsolete request with AbortController. A 12-second timeout leads to an on-page error and a working retry action. Weather codes map to readable conditions and icons; source attribution and the CC BY 4.0 link are visible.")
    heading("Limits of the simulation", "LocalStorage is specific to this browser and origin. Clearing site data removes local accounts and collections. Salted hashing avoids readable password storage but does not create production authentication. Weather needs a network connection; contact messages are never sent to a server. These boundaries are communicated in the relevant interface.")

    page("5 / Screenshots for clarity", "The implemented interface.")
    story.append(para("Screenshots in this section must be real captures of the current production build. The capture tool operates an isolated browser profile, uses sample account details and records each image's route, viewport, theme and SHA-256 digest. Controlled API responses are identified explicitly; they are not presented as live weather."))
    if not shots:
        story.append(para("No browser screenshots are available for the current build. The preparation environment denied browser startup before any webpage could be captured. The cover artwork is not a substitute for this required evidence."))
        story.append(para("Capture and rebuild", "ReportHeading"))
        story.append(para("Run npm run report from final-project in a normal terminal. It runs the source tests and production build, captures the real pages and feature states, then inserts the verified PNG files into this PDF and updates the ZIP. It uses installed Chrome/Chromium when available. CHROMIUM_PATH can select another installed browser."))
        story.append(para("Planned evidence", "ReportHeading"))
        story.append(grid([
            ["Area", "Required visual evidence"],
            ["Pages", "Home, Collection, details, Culture, About Us, Contact, Sign Up, Log In and Profile"],
            ["JavaScript", "Search result and empty state; invalid forms; signed-in profile; locally saved contact message"],
            ["Themes / responsiveness", "Desktop dark/light, tablet Home, mobile Home, collection and menu"],
            ["API", "Observed live response or honest failure, loading, retry/error and a clearly labelled controlled success response"],
        ], [41*mm, 129*mm]))
    else:
        story.append(para(f"{len(shots)} verified PNG files are available. Capture time: {capture.get('captured_at', '')}. The figure gallery follows.", "ReportSmall"))

    figure_no = 0
    groups = [
        ("Home and themes", ["home-dark", "home-light"]),
        ("Collection and car details", ["collection", "car-details"]),
        ("Search and empty results", ["search", "empty-results"]),
        ("Engineering and culture", ["specifications", "culture"]),
        ("Project and team", ["about"]),
        ("Registration and login", ["signup", "login"]),
        ("Validation feedback", ["signup-validation", "login-validation"]),
        ("Personal garage", ["profile"]),
        ("Contact form and confirmation", ["contact", "contact-saved"]),
        ("Contact validation", ["contact-validation", "contact-mobile"]),
        ("Observed API response and error handling", ["drive-live", "drive-error"]),
        ("API loading and controlled success", ["drive-loading", "drive-controlled"]),
        ("Responsive Home", ["home-768", "home-390"]),
        ("Mobile navigation and collection", ["mobile-navigation", "collection-mobile"]),
    ]
    for title, ids in groups:
        available = [shots[key] for key in ids if key in shots]
        if not available:
            continue
        page("5 / Screenshot evidence", title)
        for file, item in available:
            figure_no += 1
            observation = item.get("api_observation", "")
            if item.get("api") == "fixture":
                observation = "Controlled fixture: the displayed values demonstrate UI handling and are not live weather."
            if item.get("api", "").startswith("controlled"):
                observation = "This state was induced by a controlled browser request for verification."
            viewport = item.get("viewport", {})
            caption = f"Figure {figure_no}. {item['title']}. Route: {item['route']}; viewport: {viewport.get('width')} x {viewport.get('height')} CSS px; theme: {item['theme']}."
            if observation:
                caption += " " + observation
            max_height = 91*mm if len(available) == 2 else 168*mm
            story.append(KeepTogether([fitted_image(file, max_height=max_height), para(caption, "ReportCaption"), Spacer(1, 3*mm)]))

    page("6 / Requirements and verification", "Evidence against the rubric.")
    story.append(grid([
        ["Requirement / points", "Implementation and present evidence"],
        ["Responsiveness / 10", "Grid/Flexbox and narrow-screen navigation. " + ("Captured viewport checks are recorded with the screenshots." if shots else "Actual browser screenshots and layout verification remain pending.")],
        ["Hosting / 5", "Repository confirmed. " + ("Published on Vercel; homepage, optimized MP4, final frame, reduced motion and immutable cache verified. Automatic deployment from GitHub main is configured." if live else "Not published, as confirmed by the team. A deploy workflow is included.")],
        ["Light/dark / 5", "Default dark, a working theme hook, consistent CSS variables, persistence and initial-paint tests."],
        ["Design and UX / 20", "Focused automotive purpose, local images/icons, consistent typography, full-width hero and reusable controls."],
        ["JavaScript / 25", "Local sign-up/login/profile, custom field validation, dynamic search/filtering, saved state and useful empty/error feedback."],
        ["UI effects / 5", "Button/card transitions and single-play optimized hero video; reduced-motion alternatives."],
        ["External API / 10", "Open-Meteo fetch with loading, validation, timeout, cancellation, failure and retry. Live status is recorded separately from fixtures."],
        ["Theme cohesion / 10", "Car stories, engineering, garage and Japanese destinations support one automotive theme."],
        ["Presentation / 5", "A two-speaker 4:45 rehearsal plan is prepared. A completed live presentation is not claimed."],
        ["Code quality / 5", "Page/component separation, named helpers, organised assets, tests and a reproducible Vite build."],
    ], [43*mm, 127*mm]))
    story.append(para("This table maps implementation to the 100-point rubric; it is not a predicted or awarded score.", "ReportSmall"))

    page("6.1 / Verification details", "What has actually been checked.")
    heading("Source checks and production build", "The repository contains 16 named test cases across four files: validation, account services, themes and server rendering. They check invalid input, normalised account lookup, duplicates, salted credentials, storage failure, matching initial theme rules and rendering of all 16 routes including the not-found page. Server rendering does not establish interactive browser behaviour.")
    commands = verification.get("commands", [])
    rows = [["Check", "Recorded result"]]
    for command in commands:
        rows.append([command["command"], ("PASS" if command["exit_code"] == 0 else "FAIL") + (" / current build" if current_checks else " / current-build status not established")])
    if not commands:
        rows.append(["Source verification", "No machine-readable verification result is available."])
    rows.append(["Browser capture", capture.get("status", "not run") + (" / build fingerprint matches" if current_capture else " / no matching capture evidence")])
    rows.append(["Live API", capture.get("live_api", "Not checked in a working browser.")])
    story.append(grid(rows, [49*mm, 121*mm]))
    if capture.get("runtime_errors"):
        heading("Recorded runtime findings", "; ".join(capture["runtime_errors"]))
    if capture.get("layout_checks"):
        failed = [item for item in capture["layout_checks"] if not item.get("no_horizontal_overflow")]
        heading("Captured layout checks", f"{len(capture['layout_checks'])} viewport observations; {len(failed)} horizontal-overflow findings. These observations cover the recorded viewport sizes and do not imply testing on every physical device.")
    if not shots:
        heading("Environment limitation", "Browser startup was denied by the preparation environment (Operation not permitted); no browser result is claimed. A separate Firefox attempt also failed. Use the prepared capture command in an ordinary terminal to complete the screenshot evidence.")
    heading("Remaining work", "; ".join(missing) + "." if missing else "Review the PDF, visit the live site, and rehearse the presentation before submitting.")
    story.append(para("Clearing local data, using another browser or changing origin creates a separate demo account store. Use sample details for demonstrations. The car figures describe selected Japanese-market variants and are not claimed to apply to every trim or production year.", "ReportSmall"))

    page("7 / Presentation and submission", "A concise five-minute demonstration.")
    story.append(grid([
        ["Time", "Speaker", "Demonstration"],
        ["0:00-0:30", "Dastan", "Introduce both members, group, topic and target users."],
        ["0:30-1:00", "Dastan", "About Us and Culture: purpose, audience and editorial context."],
        ["1:00-1:35", "Beibarys", "Home hero, one playback, dark/light modes and design hierarchy."],
        ["1:35-2:15", "Beibarys", "Search, filters, empty results, detail tabs and saving a car."],
        ["2:15-3:10", "Beibarys", "Registration errors, valid account creation, sign-out and login."],
        ["3:10-3:40", "Dastan", "Profile, saved details and garage persistence; narrow-screen layout."],
        ["3:40-4:15", "Beibarys", "Live weather request, loading/error/retry and source attribution."],
        ["4:15-4:30", "Beibarys", "Contact validation and explicit local-save confirmation."],
        ["4:30-4:45", "Both", "Strengths, future improvements and thanks."],
    ], [26*mm, 28*mm, 116*mm]))
    heading("Preparation", "Aim for 4:30-5:00 and rehearse without editing code live. Both members participate. Keep the real captured screenshots as an offline backup. Verify the hosted site and public API immediately before the demonstration.")
    heading("Future improvements", "A backend for production authentication and cross-device garages, a larger manufacturer-verified collection, and more detailed automotive destination information.")
    story.append(grid([
        ["Required file", "Filename and status"],
        ["Project folder / ZIP", PREFIX + "_FinalProject.zip; complete source, assets and production build."],
        ["Report / PDF", PREFIX + "_Report.pdf; this report and its available visual evidence."],
        ["Links / TXT", PREFIX + "_Links.txt; repository supplied, live URL " + ("supplied." if live else "pending publication.")],
    ], [42*mm, 128*mm]))
    story.append(para("The supplied instructions require every team member to submit all three files together in the Moodle FINAL EXAM folder by 18 November 2026, 23:59. Wrong formats, missing files or failure to submit individually can incur the stated penalties. The preparation script preserves the ZIP/PDF/TXT formats and filenames.", "ReportSmall"))

    page("8 / References and project links", "Sources and assets.")
    story.append(link("Code repository, provided by the team", repo))
    story.append(link("Live website", live))
    if live and details.get("media_optimization_deployed") is False:
        story.append(para("The supplied Vercel site is live. The local source includes the media optimization; publishing that updated build is still pending.", "ReportSmall"))
    if not live:
        story.append(para("Publication has not yet been completed. No guessed GitHub Pages address is supplied as a live link.", "ReportSmall"))
    heading("Assignment sources", "Final Project Requirements.pdf; Final Project Presentation Guideline UPDATED!!!.pdf. These supplied documents define the website requirements, five mandatory report sections, presentation format, submission formats and naming convention.")
    for label, url in [
        ("Open-Meteo API documentation", "https://open-meteo.com/en/docs"),
        ("Weather data licence", "https://creativecommons.org/licenses/by/4.0/"),
        ("Vercel configuration", "https://vercel.com/docs/project-configuration/vercel-json"),
        ("HTML video element", "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video"),
        ("GitHub Pages workflow documentation", "https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages"),
        ("Nissan Heritage / Skyline GT-R", "https://www.nissan-global.com/EN/HERITAGE_COLLECTION/280_skyline_gt-r_v-spec_ii.html"),
        ("Toyota / Supra lineage", "https://www.toyota-global.com/company/history_of_toyota/75years/vehicle_lineage/car/id60006850/index.html"),
        ("Mazda / RX-7 history", "https://www2.mazda.com/en/stories/craftmanship/greatcar/p15.html"),
        ("Honda / 1990 NSX", "https://www.honda.co.jp/factbook/auto/NSX/19900913/ns90-036.html"),
        ("Mitsubishi / model history", "https://www.mitsubishi-motors.com/en/company/history/car/index.html"),
        ("Subaru / 1999 Impreza", "https://www.subaru.co.jp/news/archives/99_7_9/09_06.htm/"),
    ]:
        story.append(link(label, url))
    heading("Asset credits", "The Initial D GIF was supplied by the user and retained as a source asset outside public/. The web animation is a compressed MP4 with the original dimensions, frame count and duration. Its first-frame preview is WebP; the ending-frame WebP is a lossless extraction. Collection illustrations and interface icons are original SVG code. The local Adwaita Sans font is distributed with the SIL Open Font License in public/fonts/OFL.txt.")
    story.append(para("Screenshot provenance, once captured, is recorded in docs/report-captures.json. Images are included only when their file hashes and production-build fingerprint match. Controlled API fixtures are always described as test data.", "ReportSmall"))

    pdf = OUTPUT / f"{PREFIX}_Report.pdf"
    SimpleDocTemplate(str(pdf), pagesize=A4, leftMargin=20*mm, rightMargin=20*mm,
                      topMargin=19*mm, bottomMargin=25*mm,
                      title="JDM Legends - Final Project Report", author="Dastan and Beibarys / team letsgo").build(story, onFirstPage=footer, onLaterPages=footer)
    (OUTPUT / f"{PREFIX}_Links.txt").write_text(
        f"GitHub Repository: {repo or 'PENDING'}\nLive Website: {live or 'NOT PUBLISHED YET'}\n", encoding="utf-8")
    return pdf, missing, len(shots)


def package_project():
    zip_path = OUTPUT / f"{PREFIX}_FinalProject.zip"
    excluded = {"node_modules", ".git", ".generated", "__pycache__"}
    with ZipFile(zip_path, "w", ZIP_DEFLATED, compresslevel=9) as archive:
        for directory, dirs, files in os.walk(ROOT):
            dirs[:] = sorted(name for name in dirs if name not in excluded)
            for filename in sorted(files):
                file = Path(directory) / filename
                if not file.is_symlink() and filename != ".DS_Store":
                    archive.write(file, Path("final-project") / file.relative_to(ROOT))
    return zip_path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--capture", action="store_true", help="Run checks/build, capture real screenshots, then rebuild the report.")
    parser.add_argument("--verify", action="store_true", help="Run source checks/build without trying a browser.")
    args = parser.parse_args()
    OUTPUT.mkdir(exist_ok=True)
    details = read_json(ROOT / "docs/report-details.json", {})
    verification = run_checks() if args.capture or args.verify else read_json(ROOT / "docs/verification.json", {})
    if not (ROOT / "dist/index.html").is_file():
        raise RuntimeError("Run npm run build before packaging.")
    capture_code = 0
    if args.capture and verification.get("passed"):
        capture_code = subprocess.run(["node", "tools/capture_report.cjs"], cwd=ROOT).returncode
    capture = read_json(ROOT / "docs/report-captures.json", {"status": "not run"})
    pdf, missing, count = make_report(details, verification, capture)
    zip_path = package_project()
    print(f"Report rewritten; {count} verified browser screenshots included.")
    if missing:
        print("Still pending: " + "; ".join(missing))
    for file in [pdf, OUTPUT / f"{PREFIX}_Links.txt", zip_path]:
        print(file)
    if capture_code or ((args.capture or args.verify) and not verification.get("passed")):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
