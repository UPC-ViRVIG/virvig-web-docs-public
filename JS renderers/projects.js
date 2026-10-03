/*
 * ViRVIG projects renderer for GenWeb6.
 *
 * Add an empty element with id="virvig-projects" to a GenWeb page, then load
 * this file from the site's Resources configuration. The former
 * data-virvig-projects attribute is also supported.
 */
(function () {
  "use strict";

  var REPOSITORY_BASE_URL =
    "https://cdn.jsdelivr.net/gh/UPC-ViRVIG/virvig-web-docs-public@main/";
  var runtimeUrl = window.ViRVIG_PUBLIC_URL || function (path) {
    return REPOSITORY_BASE_URL + String(path).replace(/^\/+/, "");
  };
  var PROJECTS_URL = runtimeUrl("data/projects.json");
  var CONTAINER_SELECTOR = "#virvig-projects, [data-virvig-projects]";
  var DESCRIPTION_PREVIEW_LENGTH = 300;

  function localToday() {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  function parseLocalDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return null;
    }
    var date = new Date(value + "T00:00:00");
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function isCurrent(project, today) {
    var endDate = parseLocalDate(project.end_date);
    return endDate !== null && endDate >= today;
  }

  function assetUrl(path) {
    return runtimeUrl(path);
  }

  function appendText(parent, tagName, className, value) {
    var element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    element.textContent = value;
    parent.appendChild(element);
    return element;
  }

  function normalizeSearchText(value) {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase();
  }

  function matchesSearch(project, searchTerm) {
    if (!searchTerm) {
      return true;
    }
    return normalizeSearchText([
      project.title,
      project.description || "",
      project.funding_institution || "",
      project.code || ""
    ].join(" ")).indexOf(searchTerm) !== -1;
  }

  function projectPeriod(project) {
    return project.start_date + " – " + (project.end_date || "Ongoing");
  }

  function descriptionPreview(description) {
    if (description.length <= DESCRIPTION_PREVIEW_LENGTH) {
      return description;
    }
    var cutAt = description.lastIndexOf(" ", DESCRIPTION_PREVIEW_LENGTH);
    if (cutAt < DESCRIPTION_PREVIEW_LENGTH / 2) {
      cutAt = DESCRIPTION_PREVIEW_LENGTH;
    }
    return description.slice(0, cutAt) + "…";
  }

  function addDescription(body, project) {
    if (!project.description) {
      return;
    }

    var description = project.description;
    var preview = descriptionPreview(description);
    var previewElement = appendText(body, "p", "card-text", preview);
    if (preview === description) {
      return;
    }

    var collapseId = "virvig-project-details-" + project.id;
    var collapse = document.createElement("div");
    collapse.className = "collapse";
    collapse.id = collapseId;
    appendText(collapse, "p", "card-text", description);
    body.appendChild(collapse);

    var button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-link p-0 mb-3 align-self-start";
    button.setAttribute("data-bs-toggle", "collapse");
    button.setAttribute("data-bs-target", "#" + collapseId);
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", collapseId);
    button.textContent = "Read more";
    collapse.addEventListener("shown.bs.collapse", function () {
      previewElement.hidden = true;
      button.textContent = "Read less";
    });
    collapse.addEventListener("hidden.bs.collapse", function () {
      previewElement.hidden = false;
      button.textContent = "Read more";
    });
    body.appendChild(button);
  }

  function addContacts(body, project) {
    if (!project.contacts || project.contacts.length === 0) {
      return;
    }

    var contacts = project.contacts.filter(function (person) {
      return person && typeof person.name === "string";
    });
    if (contacts.length === 0) {
      return;
    }

    var contactList = document.createElement("div");
    contactList.className = "mt-3 pt-3 border-top";
    appendText(contactList, "h4", "h6 mb-2", "Contacts");
    contacts.forEach(function (person) {
      var entry = document.createElement("div");
      entry.className = "small";
      if (person.email) {
        var link = document.createElement("a");
        link.href = "mailto:" + person.email;
        link.textContent = person.name + " — " + person.email;
        entry.appendChild(link);
      } else {
        entry.textContent = person.name;
      }
      contactList.appendChild(entry);
    });
    body.appendChild(contactList);
  }

  function createProjectCard(project) {
    var column = document.createElement("div");
    column.className = "col";
    column.dataset.virvigProjectId = project.id;

    var card = document.createElement("article");
    card.className = "card h-100 shadow-sm";
    column.appendChild(card);

    if (project.image) {
      var image = document.createElement("img");
      image.className = "img-fluid align-self-center mt-3";
      image.src = assetUrl(project.image);
      image.alt = "";
      image.loading = "lazy";
      image.style.height = "160px";
      image.style.maxWidth = "100%";
      image.style.objectFit = "contain";
      card.appendChild(image);
    }

    var body = document.createElement("div");
    body.className = "card-body d-flex flex-column";
    card.appendChild(body);

    appendText(body, "h3", "h5 card-title", project.title);
    appendText(body, "p", "small text-muted", projectPeriod(project));
    if (project.code) {
      appendText(body, "p", "small text-muted", project.code);
    }
    if (project.funding_institution) {
      appendText(body, "p", "small text-muted", project.funding_institution);
    }
    addDescription(body, project);

    if (project.webpage) {
      var link = document.createElement("a");
      link.className = "btn btn-outline-primary btn-sm align-self-start";
      link.href = project.webpage;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Project website";
      body.appendChild(link);
    }
    addContacts(body, project);

    return column;
  }

  function createSection(title, projects) {
    var section = document.createElement("section");
    section.className = "mb-5";
    appendText(section, "h2", "h3 mb-3", title);

    var row = document.createElement("div");
    row.className = "row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4";
    projects.forEach(function (project) {
      row.appendChild(createProjectCard(project));
    });
    section.appendChild(row);
    return section;
  }

  function compareByEndDate(first, second) {
    return String(second.end_date || "9999-12-31").localeCompare(
      String(first.end_date || "9999-12-31")
    );
  }

  function render(container, projects) {
    container.replaceChildren();

    var today = localToday();
    var currentProjects = projects.filter(function (project) {
      return isCurrent(project, today);
    }).sort(compareByEndDate);
    var pastProjects = projects.filter(function (project) {
      return !isCurrent(project, today);
    }).sort(compareByEndDate);
    var projectsById = Object.fromEntries(projects.map(function (project) {
      return [project.id, project];
    }));

    var searchLabel = document.createElement("label");
    searchLabel.className = "form-label visually-hidden";
    searchLabel.htmlFor = "virvig-projects-search";
    searchLabel.textContent = "Search projects";
    container.appendChild(searchLabel);

    var search = document.createElement("input");
    search.id = "virvig-projects-search";
    search.className = "form-control mb-4";
    search.type = "search";
    search.placeholder = "Search projects";
    search.autocomplete = "off";
    container.appendChild(search);

    var currentSection = createSection("Current projects", currentProjects);
    var pastSection = createSection("Past projects", pastProjects);
    container.appendChild(currentSection);
    container.appendChild(pastSection);

    var noResults = appendText(container, "p", "text-muted d-none", "No projects found.");
    search.addEventListener("input", function () {
      var searchTerm = normalizeSearchText(search.value.trim());
      var visibleProjects = 0;

      [currentSection, pastSection].forEach(function (section) {
        var sectionHasResults = false;
        section.querySelectorAll(".col[data-virvig-project-id]").forEach(function (column) {
          var project = projectsById[column.dataset.virvigProjectId];
          var visible = matchesSearch(project, searchTerm);
          column.classList.toggle("d-none", !visible);
          sectionHasResults = sectionHasResults || visible;
          if (visible) {
            visibleProjects += 1;
          }
        });
        section.classList.toggle("d-none", !sectionHasResults);
      });
      noResults.classList.toggle("d-none", visibleProjects !== 0);
    });
  }

  function showError(container) {
    container.replaceChildren();
    appendText(container, "p", "text-muted", "Projects could not be loaded.");
  }

  function initialise() {
    var containers = document.querySelectorAll(CONTAINER_SELECTOR);
    if (containers.length === 0) {
      return;
    }

    fetch(PROJECTS_URL, { credentials: "omit" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Unable to load projects: " + response.status);
        }
        return response.json();
      })
      .then(function (projects) {
        if (!Array.isArray(projects)) {
          throw new Error("Projects data is not an array.");
        }
        containers.forEach(function (container) {
          render(container, projects);
        });
      })
      .catch(function () {
        containers.forEach(showError);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise, { once: true });
  } else {
    initialise();
  }
}());
