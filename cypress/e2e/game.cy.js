describe("Stranded", () => {
  const startNewStory = () => {
    cy.visit("/", {
      onBeforeLoad(window) {
        window.localStorage.clear();
      },
    });
    cy.contains("Begin transmission").click();
  };

  it("starts a new story and advances", () => {
    startNewStory();
    cy.contains("Cryo Bay");
    cy.contains("Advance forward").click();
    cy.get(".movement-stage")
      .should("have.attr", "data-direction", "forward")
      .and("have.attr", "data-moving", "true");
    cy.get(".choice").should("be.disabled");
    cy.contains("Med Transit");
    cy.contains("190").should("be.visible");
  });

  it("ignores rapid repeat navigation and moves backward", () => {
    startNewStory();
    cy.contains("button", "Advance forward").then(($button) => {
      $button[0].click();
      $button[0].click();
    });
    cy.get('[aria-label="Exploring Med Transit"]');
    cy.contains("190").should("be.visible");

    cy.contains("Go back").click();
    cy.get(".movement-stage").should("have.attr", "data-direction", "backward");
    cy.get('[aria-label="Exploring Cryo Bay"]');
    cy.contains("180").should("be.visible");
  });

  it("maps port and starboard rooms to left and right movement", () => {
    cy.visit("/game", {
      onBeforeLoad(window) {
        window.localStorage.setItem("storyGameSave", JSON.stringify({
          currentRoom: "1c",
          previousRoom: "1b",
          oxygen: 180,
        }));
      },
    });

    cy.contains("Enter Port F").click();
    cy.get(".movement-stage").should("have.attr", "data-direction", "left");
    cy.contains("Into the void");
    cy.contains("Start from beginning").click();

    cy.contains("Advance forward").click();
    cy.contains("Med Transit");
    cy.contains("Advance forward").click();
    cy.contains("Service Junction");
    cy.contains("Enter Starboard H").click();
    cy.get(".movement-stage").should("have.attr", "data-direction", "right");
    cy.get('[aria-label="Exploring Auxiliary Power"]');
  });

  it("runs scans immediately without triggering movement", () => {
    cy.visit("/game", {
      onBeforeLoad(window) {
        window.localStorage.setItem("storyGameSave", JSON.stringify({
          currentRoom: "1c",
          previousRoom: "1b",
          oxygen: 180,
          battery: 1,
          inventory: ["scanner"],
        }));
      },
    });

    cy.contains("Scan Port F").click();
    cy.get(".movement-stage")
      .should("have.attr", "data-direction", "idle")
      .and("have.attr", "data-moving", "false");
    cy.contains("Pressure readings show the room is open to vacuum.");
  });
});
