const DATA_FILES = {
  personal: "data/personal-info.json",
  work: "data/work-exp.json",
  education: "data/accademy-exp.json",
  projects: "data/personal-exp.json",
  hobbies: "data/hobbies.json",
  publications: "data/publications.json"
};

const resume = document.querySelector("#resume");

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

function formatDate(value) {
  if (!value) return "Present";
  if (/^\d{4}$/.test(value)) return value;
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
    timeZone: "UTC"
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
    element("p", "summary", personal.summary)
  );
  identity.firstElementChild.setAttribute("aria-hidden", "true");

  const photo = element("img", "profile-photo");
  photo.src = personal.photo;
  photo.alt = `Portrait of ${personal.name}`;
  photo.width = 144;
  photo.height = 144;
  header.append(identity, photo);
  return header;
}

function renderContact(personal) {
  const contact = element("address", "contact-list");
  const items = [
    [personal.location, null],
    [personal.email, `mailto:${personal.email}`],
    [personal.phone, `tel:${personal.phone.replace(/\s/g, "")}`],
    [personal.website.label, personal.website.url],
    [`GitHub: ${personal.github.label}`, personal.github.url],
    [`LinkedIn: ${personal.linkedin.label}`, personal.linkedin.url]
  ];

  for (const [label, url] of items) {
    const row = element("div", "contact-item");
    row.append(url ? link(label, url) : document.createTextNode(label));
    contact.append(row);
  }
  return contact;
}

function renderSkills(skills) {
  const container = element("div", "skill-groups");
  for (const [group, values] of Object.entries(skills)) {
    const block = element("div", "skill-group");
    block.append(element("h3", null, group));
    const list = element("ul", "tag-list");
    values.forEach((value) => {
      const item = element("li", null, value);
      list.append(item);
    });
    block.append(list);
    container.append(block);
  }
  return container;
}

function renderLanguages(languages) {
  const list = element("dl", "language-list");
  languages.forEach(({ name, level }) => {
    list.append(element("dt", null, name), element("dd", null, level));
  });
  return list;
}

function renderHobbies(hobbies) {
  const list = element("ul", "hobby-list");
  hobbies.forEach((hobby) => list.append(element("li", null, hobby)));
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
      element("p", "entry-organization", `${job.company} · ${job.location}`)
    );
    heading.append(titleBlock, element("p", "entry-date", dateRange(job.startDate, job.endDate)));

    const highlights = element("ul", "highlights");
    job.highlights.forEach((highlight) => highlights.append(element("li", null, highlight)));
    article.append(heading, highlights);
    container.append(article);
  });
  return container;
}

function renderProjects(projects) {
  const container = element("div", "projects");
  const professionalProjects = projects.filter((project) => !project.compact);

  professionalProjects.forEach((project) => {
    const article = element("article", "project");
    const heading = element("div", "entry-heading");
    const titleBlock = element("div");
    const title = element("h3", "entry-title");
    title.append(project.url ? link(project.name, project.url) : document.createTextNode(project.name));
    titleBlock.append(title, element("p", "entry-organization", project.organization));
    const dates = dateRange(project.startDate, project.endDate);
    heading.append(titleBlock);
    if (dates) heading.append(element("p", "entry-date", dates));

    const description = element("p", "project-description", project.description);
    const technology = element("p", "technology-line");
    technology.append(element("span", "technology-label", "Technologies: "), document.createTextNode(project.technologies.join(", ")));
    article.append(heading, description, technology);
    const projectLinks = element("div", "project-links");
    if (project.repository) {
      projectLinks.append(link(project.repository.label, project.repository.url, "article-link"));
    }
    if (project.article) {
      projectLinks.append(link(project.article.label, project.article.url, "article-link"));
    }
    if (projectLinks.childElementCount) article.append(projectLinks);
    container.append(article);
  });
  return container;
}

function renderAcademicProjects(projects) {
  const grid = element("div", "compact-projects");
  projects.filter((project) => project.compact).forEach((project) => {
    const article = element("article", "compact-project");
    const title = element("h3", "compact-project-title");
    title.append(project.url ? link(project.name, project.url) : document.createTextNode(project.name));
    const description = element("p", null, project.description);
    const technologies = element("p", "technology-line", project.technologies.join(", "));
    article.append(title, description, technologies);
    grid.append(article);
  });
  return grid;
}

function renderEducation(education) {
  const container = element("div", "education-list");
  education.forEach((item) => {
    const article = element("article", "education-entry");
    const heading = element("div", "entry-heading");
    const titleBlock = element("div");
    titleBlock.append(
      element("h3", "entry-title", item.qualification),
      element("p", "entry-organization", `${item.institution} · ${item.location}`)
    );
    heading.append(titleBlock, element("p", "entry-date", dateRange(item.startDate, item.endDate)));
    article.append(heading, element("p", "grade", `Grade: ${item.grade}`));
    container.append(article);
  });
  return container;
}

function renderPublications(publications, featuredAuthor) {
  const list = element("div", "publication-list");
  publications.forEach((publication) => {
    const article = element("article", "publication");
    const heading = element("div", "publication-heading");
    const title = element("h3", "publication-title");
    title.append(link(publication.title, publication.url));
    heading.append(title, element("p", "entry-date", publication.year));

    const metadata = element(
      "p",
      "publication-metadata",
      [publication.publisher, publication.context].filter(Boolean).join(" · ")
    );
    article.append(heading, metadata);
    if (publication.authors?.length) {
      const authors = element("p", "publication-authors");
      authors.append(element("span", "authors-label", publication.authors.length === 1 ? "Author: " : "Authors: "));
      publication.authors.forEach((author, index) => {
        if (index) authors.append(document.createTextNode(", "));
        authors.append(
          author === featuredAuthor
            ? element("span", "featured-author", author)
            : document.createTextNode(author)
        );
      });
      article.append(authors);
    }
    list.append(article);
  });
  return list;
}

function renderResume({ personal, work, education, projects, hobbies, publications }) {
  const content = document.createDocumentFragment();
  content.append(renderHeader(personal));

  const layout = element("div", "resume-layout");
  const sidebar = element("div", "sidebar");
  const contactSection = section("Contact", "compact-section");
  contactSection.append(renderContact(personal));
  const skillsSection = section("Core Skills", "compact-section");
  skillsSection.append(renderSkills(personal.skills));
  const languageSection = section("Languages", "compact-section");
  languageSection.append(renderLanguages(personal.languages));
  const hobbiesSection = section("Hobbies", "compact-section");
  hobbiesSection.append(renderHobbies(hobbies));
  const privacyConsent = element("p", "privacy-consent", personal.privacyConsent);
  sidebar.append(contactSection, skillsSection, languageSection, hobbiesSection, privacyConsent);

  const primary = element("div", "primary-content");
  const workSection = section("Professional Experience");
  workSection.append(renderWork(work));
  const professionalProjects = projects.filter((project) => !project.compact);
  const projectSection = section("Selected Projects");
  projectSection.append(renderProjects(professionalProjects.slice(0, 1)));
  const continuedProjects = element("div", "continued-projects");
  const continuationTitle = element("p", "section-title print-continuation-title", "Selected Projects");
  continuationTitle.setAttribute("aria-hidden", "true");
  continuedProjects.append(
    continuationTitle,
    renderProjects(professionalProjects.slice(1))
  );
  const educationSection = section("Education");
  const academicProjects = element("div", "academic-project-group");
  academicProjects.append(
    element("h3", "subsection-title", "Academic Projects"),
    renderAcademicProjects(projects)
  );
  educationSection.append(renderEducation(education), academicProjects);
  const publicationsSection = section("Publications");
  publicationsSection.append(renderPublications(publications, personal.name));
  const pageFooter = element("footer", "page-footer");
  pageFooter.setAttribute("aria-hidden", "true");
  pageFooter.append(
    element("span", null, `${personal.name} · ${personal.title}`),
    element("span", null, "2 / 2")
  );
  const pageTwoContent = element("div", "page-two-content");
  pageTwoContent.append(continuedProjects, educationSection, publicationsSection, pageFooter);
  primary.append(workSection, projectSection, pageTwoContent);

  layout.append(sidebar, primary);
  content.append(layout);
  resume.replaceChildren(content);
}

async function loadResume() {
  try {
    const responses = await Promise.all(Object.values(DATA_FILES).map((path) => fetch(path)));
    const failed = responses.find((response) => !response.ok);
    if (failed) throw new Error(`Unable to load ${failed.url} (${failed.status})`);
    const [personal, work, education, projects, hobbies, publications] = await Promise.all(
      responses.map((response) => response.json())
    );
    renderResume({ personal, work, education, projects, hobbies, publications });
  } catch (error) {
    console.error(error);
    resume.replaceChildren(
      element("p", "error-message", "The resume data could not be loaded. Start a local web server and reload the page.")
    );
  }
}

loadResume();
