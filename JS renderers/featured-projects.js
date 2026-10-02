/*
 * ViRVIG featured projects renderer for GenWeb6.
 *
 * Add an empty element with id="virvig-featured-projects" to a GenWeb page,
 * then load this file from the site's Resources configuration. The former
 * data-virvig-featured-projects attribute remains supported.
 */
(function () {
  "use strict";

  var REPOSITORY_BASE_URL =
    "https://upc-virvig.github.io/virvig-web-docs-public/";
  var PROJECTS_URL = REPOSITORY_BASE_URL + "data/projects.json";
  var CONTAINER_SELECTOR =
    "#virvig-featured-projects, [data-virvig-featured-projects]";
  var DESCRIPTION_PREVIEW_LENGTH = 360;

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

  function isFeatured(project, today) {
    var endDate = parseLocalDate(project.end_date);

    // Open-ended projects are intentionally not featured.
    return endDate !== null && endDate >= today;
  }

  function assetUrl(path) {
    return REPOSITORY_BASE_URL + String(path).replace(/^\/+/, "");
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

  function projectPeriod(project) {
    return project.start_date + " – " + project.end_date;
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

    var collapseId = "virvig-project-description-" + project.id;
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

  function createProjectCard(project) {
    var column = document.createElement("div");
    column.className = "col";

    var card = document.createElement("article");
    card.className = "card h-100 shadow-sm";
    column.appendChild(card);

    if (project.image) {
      var image = document.createElement("img");
      image.className = "card-img-top";
      image.src = assetUrl(project.image);
      image.alt = "";
      image.loading = "lazy";
      card.appendChild(image);
    }

    var body = document.createElement("div");
    body.className = "card-body d-flex flex-column";
    card.appendChild(body);

    appendText(body, "h3", "h5 card-title", project.title);
    appendText(body, "p", "small text-muted", projectPeriod(project));

    addDescription(body, project);

    if (project.webpage) {
      var link = document.createElement("a");
      link.className = "btn btn-primary mt-auto align-self-start";
      link.href = project.webpage;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Project website";
      body.appendChild(link);
    }

    return column;
  }

  function render(container, projects) {
    var featured = projects.filter(function (project) {
      return isFeatured(project, localToday());
    });

    container.replaceChildren();

    if (featured.length === 0) {
      appendText(container, "p", "text-muted", "No featured projects are currently available.");
      return;
    }

    var row = document.createElement("div");
    row.className = "row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4";
    featured.forEach(function (project) {
      row.appendChild(createProjectCard(project));
    });
    container.appendChild(row);
  }

  function showError(container) {
    container.replaceChildren();
    appendText(container, "p", "text-muted", "Featured projects could not be loaded.");
  }

  function loadProjects() {
    return fetch(PROJECTS_URL, { credentials: "omit" }).then(function (response) {
      if (!response.ok) {
        throw new Error("Unable to load projects: " + response.status);
      }
      return response.json();
    });
  }

  function initialise() {
    var containers = document.querySelectorAll(CONTAINER_SELECTOR);
    if (containers.length === 0) {
      return;
    }

    loadProjects().then(function (projects) {
      if (!Array.isArray(projects)) {
        throw new Error("Projects data is not an array.");
      }
      containers.forEach(function (container) {
        render(container, projects);
      });
    }).catch(function () {
      containers.forEach(showError);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise, { once: true });
  } else {
    initialise();
  }
}());
