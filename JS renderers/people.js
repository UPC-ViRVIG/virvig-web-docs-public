/*
 * ViRVIG people renderer for GenWeb6.
 *
 * Add an empty element with id="virvig-people" to a GenWeb page, then load
 * this file from the site's Resources configuration. The former
 * data-virvig-people attribute is also supported.
 */
(function () {
  "use strict";

  var REPOSITORY_BASE_URL =
    "https://upc-virvig.github.io/virvig-web-docs-public/";
  var PEOPLE_URL = REPOSITORY_BASE_URL + "data/people.json";
  var CONTAINER_SELECTOR = "#virvig-people, [data-virvig-people]";
  var GROUPS = [
    {
      id: "faculty",
      title: "Faculty",
      roles: ["professor", "associate_professor", "assistant_professor"]
    },
    {
      id: "researchers",
      title: "Researchers",
      roles: ["researcher", "collaborator"]
    },
    {
      id: "technical-staff",
      title: "Technical staff",
      roles: ["technical_staff"]
    },
    {
      id: "students",
      title: "Students",
      roles: ["phd_student", "master_student"]
    }
  ];
  var ROLE_LABELS = {
    professor: "Professor",
    associate_professor: "Associate Professor",
    assistant_professor: "Assistant Professor",
    researcher: "Researcher",
    collaborator: "Collaborator",
    technical_staff: "Technical Staff",
    phd_student: "PhD Student",
    master_student: "Master's Student"
  };

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

  function groupFor(person) {
    return GROUPS.find(function (group) {
      return group.roles.indexOf(person.role) !== -1;
    });
  }

  function surnameSortKey(person) {
    var nameParts = person.name.trim().split(/\s+/);
    return nameParts[nameParts.length - 1];
  }

  function compareBySurname(first, second) {
    var surnameOrder = surnameSortKey(first).localeCompare(surnameSortKey(second), undefined, {
      sensitivity: "base"
    });
    if (surnameOrder !== 0) {
      return surnameOrder;
    }
    return first.name.localeCompare(second.name, undefined, { sensitivity: "base" });
  }

  function createContactLink(body, href, label, className) {
    var link = document.createElement("a");
    link.className = className;
    link.href = href;
    link.textContent = label;
    body.appendChild(link);
  }

  function createPersonCard(person) {
    var column = document.createElement("div");
    column.className = "col";

    var card = document.createElement("article");
    card.className = "card h-100 shadow-sm";
    column.appendChild(card);

    var image = document.createElement("img");
    image.className = "img-fluid align-self-center mt-3";
    image.src = assetUrl(person.photo || "assets/people/silhouette.png");
    image.alt = person.photo ? "Portrait of " + person.name : "Silhouette placeholder";
    image.loading = "lazy";
    image.style.height = "150px";
    image.style.maxWidth = "100%";
    image.style.objectFit = "contain";
    card.appendChild(image);

    var body = document.createElement("div");
    body.className = "card-body d-flex flex-column";
    card.appendChild(body);

    appendText(body, "h3", "h5 card-title", person.name);
    appendText(body, "p", "text-muted mb-2", ROLE_LABELS[person.role] || person.role);

    var affiliations = [];
    if (person.affiliations && person.affiliations.upc) {
      affiliations.push("UPC");
    }
    if (person.affiliations && person.affiliations.udg) {
      affiliations.push("UdG");
    }
    if (affiliations.length) {
      appendText(body, "p", "small text-muted", affiliations.join(" · "));
    }

    var contacts = document.createElement("div");
    contacts.className = "mt-auto d-flex flex-wrap gap-2";
    body.appendChild(contacts);

    if (person.contact && person.contact.phone) {
      createContactLink(
        contacts,
        "tel:" + person.contact.phone.replace(/[^+\d]/g, ""),
        person.contact.phone,
        "link-secondary small align-self-center"
      );
    }

    if (person.contact && person.contact.email) {
      createContactLink(
        contacts,
        "mailto:" + person.contact.email,
        "Email",
        "btn btn-outline-primary btn-sm"
      );
    }

    if (person.contact && person.contact.webpage) {
      var website = document.createElement("a");
      website.className = "btn btn-outline-secondary btn-sm";
      website.href = person.contact.webpage;
      website.target = "_blank";
      website.rel = "noopener noreferrer";
      website.textContent = "Website";
      contacts.appendChild(website);
    }

    return column;
  }

  function matchesSearch(person, searchTerm) {
    if (!searchTerm) {
      return true;
    }
    return normalizeSearchText(person.name + " " + (ROLE_LABELS[person.role] || person.role))
      .indexOf(searchTerm) !== -1;
  }

  function normalizeSearchText(value) {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase();
  }

  function createGroup(group, people) {
    var section = document.createElement("section");
    section.className = "mb-5";
    section.dataset.virvigPeopleGroup = group.id;
    appendText(section, "h2", "h3 mb-3", group.title);

    var row = document.createElement("div");
    row.className =
      "row row-cols-1 row-cols-sm-2 row-cols-lg-4 row-cols-xl-5 row-cols-xxl-6 g-4";
    people.forEach(function (person) {
      row.appendChild(createPersonCard(person));
    });
    section.appendChild(row);
    return section;
  }

  function render(container, people) {
    container.replaceChildren();

    var currentPeople = people
      .filter(function (person) {
        return person.status === "current" && groupFor(person);
      })
      .sort(compareBySurname);

    var searchLabel = document.createElement("label");
    searchLabel.className = "form-label visually-hidden";
    searchLabel.htmlFor = "virvig-people-search";
    searchLabel.textContent = "Search people";
    container.appendChild(searchLabel);

    var search = document.createElement("input");
    search.id = "virvig-people-search";
    search.className = "form-control mb-4";
    search.type = "search";
    search.placeholder = "Search people";
    search.autocomplete = "off";
    container.appendChild(search);

    var groups = GROUPS.map(function (group) {
      return {
        group: group,
        section: createGroup(
          group,
          currentPeople.filter(function (person) {
            return group.roles.indexOf(person.role) !== -1;
          })
        )
      };
    }).filter(function (entry) {
      return entry.section.querySelector(".card");
    });
    groups.forEach(function (entry) {
      container.appendChild(entry.section);
    });

    var noResults = appendText(container, "p", "text-muted d-none", "No people found.");
    search.addEventListener("input", function () {
      var searchTerm = normalizeSearchText(search.value.trim());
      var visibleCards = 0;

      groups.forEach(function (entry) {
        var groupHasResults = false;
        entry.section.querySelectorAll(".card").forEach(function (card) {
          var person = currentPeople.find(function (candidate) {
            return candidate.name === card.querySelector(".card-title").textContent;
          });
          var visible = person && matchesSearch(person, searchTerm);
          card.closest(".col").classList.toggle("d-none", !visible);
          groupHasResults = groupHasResults || visible;
          if (visible) {
            visibleCards += 1;
          }
        });
        entry.section.classList.toggle("d-none", !groupHasResults);
      });

      noResults.classList.toggle("d-none", visibleCards !== 0);
    });
  }

  function showError(container) {
    container.replaceChildren();
    appendText(container, "p", "text-muted", "People could not be loaded.");
  }

  function initialise() {
    var containers = document.querySelectorAll(CONTAINER_SELECTOR);
    if (containers.length === 0) {
      return;
    }

    fetch(PEOPLE_URL, { credentials: "omit" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Unable to load people: " + response.status);
        }
        return response.json();
      })
      .then(function (people) {
        if (!Array.isArray(people)) {
          throw new Error("People data is not an array.");
        }
        containers.forEach(function (container) {
          render(container, people);
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
