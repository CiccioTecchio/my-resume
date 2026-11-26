const DATA_FILES = {
  personal: "data/personal-info.json",
  work: "data/work-exp.json",
  education: "data/accademy-exp.json",
  projects: "data/personal-exp.json",
  publications: "data/publications.json",
};

const resume = document.querySelector("#resume");
const SVG_NS = "http://www.w3.org/2000/svg";
const CONTACT_ICON_PATHS = {
  location:
    "M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Zm-8-3a3 3 0 1 0 0 6a3 3 0 0 0 0-6Z",
  email:
    "M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm-2 2 10 7 10-7",
  phone:
    "M6.6 2.5h3.1l1.1 4.6-2 1.8a16 16 0 0 0 6.3 6.3l1.8-2 4.6 1.1v3.1a2 2 0 0 1-2.2 2A19 19 0 0 1 2.6 4.7a2 2 0 0 1 2-2.2h2Z",
  website:
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-10 10h20M12 2c3 3 4 6 4 10s-1 7-4 10M12 2c-3 3-4 6-4 10s1 7 4 10",
  github:
    "M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.3 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z",
  linkedin: "M4 9v11M4 4v.01M10 20V9m0 5a5 5 0 0 1 10 0v6",
};

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function link(label, url, className) {
  const node = element("a", className, label);
  node.href = url;
  node.setAttribute("aria-label", label);
  node.title = label;
  node.target = "_blank";
  node.rel = "noreferrer";
  return node;
}

function contactIcon(kind) {
  const icon = document.createElementNS(SVG_NS, "svg");
  icon.classList.add("contact-icon");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("focusable", "false");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", CONTACT_ICON_PATHS[kind]);
  if (kind === "github") {
    icon.setAttribute("fill", "currentColor");
  } else {
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "1.8");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
  }
  icon.append(path);
  return icon;
}

function formatDate(value) {
  if (!value) return "Present";
  if (/^\d{4}$/.test(value)) return value;
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function dateRange(startDate, endDate) {
  if (!startDate) return "";
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

function section(title, className) {
  const node = element("section", className);
  node.append(element("h2", "section-title", title));
  return node;
}

function renderHeader(personal) {
  const header = element("header", "resume-header");
  const identity = element("div", "identity");
  identity.append(
    element("p", "eyebrow", personal.title),
    element("h1", "name", personal.name),
    element("p", "summary", personal.summary),
  );
  identity.firstElementChild.setAttribute("aria-hidden", "true");

  header.append(identity);
  if (personal.photo) {
    const photo = element("img", "profile-photo");
    photo.src = personal.photo;
    photo.alt = `Portrait of ${personal.name}`;
    photo.width = 144;
    photo.height = 144;
    header.append(photo);
  }
  return header;
}

function renderContact(personal) {
  const contact = element("address", "contact-list");
  const firstName = personal.name.split(" ")[0];
  const items = [
    ["location", personal.location, null],
    ["email", personal.email, `mailto:${personal.email}`],
    ["phone", personal.phone, `tel:${personal.phone.replace(/\s/g, "")}`],
    ["website", personal.website.label, personal.website.url],
    ["github", `GitHub: ${personal.github.label}`, personal.github.url],
    ["linkedin", `LinkedIn: ${personal.linkedin.label}`, personal.linkedin.url],
  ];

  for (const [kind, label, url] of items) {
    const row = element("div", "contact-item");
    const value = url ? link(label, url) : document.createTextNode(label);
    const breakAfter =
      kind === "email"
        ? label.indexOf("@") + 1
        : kind === "website" &&
            label.toLowerCase().startsWith(firstName.toLowerCase())
          ? firstName.length
          : 0;
    if (url && breakAfter > 0 && breakAfter < label.length) {
      value.replaceChildren(
        element("span", "contact-fragment", label.slice(0, breakAfter)),
        document.createElement("wbr"),
        element("span", "contact-fragment", label.slice(breakAfter)),
      );
    }
    row.append(
      contactIcon(kind),
      value,
    );
    contact.append(row);
  }
  return contact;
}

function renderSkills(skills) {
  const container = element("div", "skill-groups");
  for (const [group, values] of Object.entries(skills)) {
    const block = element("div", "skill-group");
    block.append(element("h3", null, group));
    block.append(element("p", "skill-list", values.join(" · ")));
    container.append(block);
  }
  return container;
}

function appendEmphasizedText(node, value, keywords) {
  const terms = keywords
    .filter((keyword) => value.toLowerCase().includes(keyword.toLowerCase()))
    .sort((first, second) => second.length - first.length);
  if (!terms.length) {
    node.append(document.createTextNode(value));
    return;
  }
  const escaped = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
  const matches = new Set(terms.map((term) => term.toLowerCase()));
  value.split(pattern).forEach((part) => {
    node.append(
      matches.has(part.toLowerCase())
        ? element("strong", null, part)
        : document.createTextNode(part),
    );
  });
}

function renderLanguages(languages) {
  const list = element("dl", "language-list");
  languages.forEach(({ name, level }) => {
    list.append(element("dt", null, name), element("dd", null, level));
  });
  return list;
}

function renderWork(work) {
  const container = element("div", "timeline");
  work.forEach((job) => {
    const article = element("article", "timeline-entry");
    const heading = element("div", "entry-heading");
    const titleBlock = element("div");
    titleBlock.append(
      element("h3", "entry-title", job.role),
      element("p", "entry-organization", `${job.company} · ${job.location}`),
    );
    heading.append(
      titleBlock,
      element("p", "entry-date", dateRange(job.startDate, job.endDate)),
    );

    const highlights = element("ul", "highlights");
    job.highlights.forEach((highlight) => {
      const item = element("li");
      const outcome = highlight.match(/^([A-Za-z]+): (.+)$/);
      if (outcome) {
        item.append(element("strong", null, outcome[1]), ": ");
      }
      appendEmphasizedText(item, outcome ? outcome[2] : highlight, job.keywords);
      highlights.append(item);
    });
    article.append(heading, highlights);
    container.append(article);
  });
  return container;
}

function renderPersonalProjects(projects) {
  const container = element("div", "personal-projects");
  projects
    .filter((project) => project.independentProject)
    .sort(
      (first, second) =>
        first.independentProjectOrder - second.independentProjectOrder,
    )
    .forEach((project) => {
      const article = element("article", "personal-project");
      const title = element("h3", "entry-title");
      const url = project.url || project.repository?.url;
      title.append(url ? link(project.name, url) : project.name);
      const description = element("p", "project-description");
      appendEmphasizedText(description, project.description, project.technologies);
      article.append(title, description);
      container.append(article);
    });
  return container;
}

function renderEducation(education) {
  const container = element("div", "education-list");
  education.forEach((item) => {
    const article = element("article", "education-entry");
    article.append(
      element("h3", "entry-title", item.qualification),
      element("p", "entry-organization", item.institution),
      element("p", "entry-date", dateRange(item.startDate, item.endDate)),
      element("p", "grade", `Grade: ${item.grade}`),
    );
    container.append(article);
  });
  return container;
}

function renderPublications(publications) {
  const container = element("div", "publication-list");
  publications.forEach((publication) => {
    const article = element("article", "publication");
    const title = element("h3", "publication-title");
    title.append(link(publication.title, publication.url));
    article.append(
      title,
      element(
        "p",
        "publication-metadata",
        `${publication.publisher} · ${publication.year}`,
      ),
    );
    container.append(article);
  });
  return container;
}

function renderResume({
  personal,
  work,
  education,
  projects,
  publications,
}) {
  const layout = element("div", "resume-layout");
  const sidebar = element("aside", "sidebar");
  const contactSection = section("Contact");
  contactSection.append(renderContact(personal));
  const skillsSection = section("Technical Skills");
  skillsSection.append(renderSkills(personal.skills));
  const publicationsSection = section("Publications");
  publicationsSection.append(renderPublications(publications));
  const educationSection = section("Education");
  educationSection.append(renderEducation(education));
  const languageSection = section("Languages");
  languageSection.append(renderLanguages(personal.languages));
  sidebar.append(
    contactSection,
    skillsSection,
    publicationsSection,
    educationSection,
    languageSection,
  );
  if (personal.privacyConsent) {
    sidebar.append(element("p", "privacy-consent", personal.privacyConsent));
  }

  const primary = element("div", "primary-content");
  const workSection = section("Professional Experiences");
  workSection.append(renderWork(work));
  const projectSection = section("Personal Projects");
  projectSection.append(renderPersonalProjects(projects));
  primary.append(workSection, projectSection);

  layout.append(sidebar, primary);
  resume.replaceChildren(renderHeader(personal), layout);
}

async function loadResume() {
  try {
    const responses = await Promise.all(
      Object.values(DATA_FILES).map((path) =>
        fetch(path, { cache: "no-store" }),
      ),
    );
    const failed = responses.find((response) => !response.ok);
    if (failed)
      throw new Error(`Unable to load ${failed.url} (${failed.status})`);
    const [personal, work, education, projects, publications] =
      await Promise.all(responses.map((response) => response.json()));
    renderResume({
      personal,
      work,
      education,
      projects,
      publications,
    });
  } catch (error) {
    console.error(error);
    resume.replaceChildren(
      element(
        "p",
        "error-message",
        "The resume data could not be loaded. Start a local web server and reload the page.",
      ),
    );
  }
}

loadResume();
