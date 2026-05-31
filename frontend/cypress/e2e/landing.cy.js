describe('Landing Page - Portal Selector', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173/');
  });

  it('displays the NKids landing page with all three cards', () => {
    cy.contains('h1', 'NKids').should('be.visible');
    cy.contains('Integrated Production Ecosystem').should('be.visible');
    
    // Check for all three portal cards
    cy.contains('Management & Analytics').should('be.visible');
    cy.contains('Production Station').should('be.visible');
    cy.contains('Customer Tracking').should('be.visible');
  });

  it('Admin/Management card navigates to login page', () => {
    cy.contains('Management & Analytics').parent().click();
    cy.url().should('include', '/login');
    cy.contains('Login').should('be.visible');
  });

  it('Production Station card navigates to station login', () => {
    cy.contains('Production Station').parent().click();
    cy.url().should('include', '/station/login');
    cy.contains('Select Workstation').should('be.visible');
  });

  it('Customer Tracking card navigates to tracking page', () => {
    cy.contains('Customer Tracking').parent().click();
    cy.url().should('include', '/tracking');
  });

  it('footer links are visible', () => {
    cy.contains('Support Center').should('be.visible');
    cy.contains('System Status').should('be.visible');
  });
});
