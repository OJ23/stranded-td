describe("Stranded", () => {
  it("starts a new story and advances", () => {
    cy.visit("/");
    cy.contains("Begin transmission").click();
    cy.contains("Cryo Bay");
    cy.contains("Advance forward").click();
    cy.contains("Med Transit");
    cy.contains("90").should("be.visible");
  });
});
