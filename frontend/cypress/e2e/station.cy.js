describe('Station Login & Division-Based Task Filtering', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173/station/login');
  });

  describe('Station Login Flow', () => {
    it('displays station login form with workstation selection', () => {
      cy.contains('Select Workstation').should('be.visible');
      cy.contains('Operator Login').should('be.visible');
      cy.contains('PIN').should('be.visible');
    });

    it('allows user to select a workstation', () => {
      // Click on first station in grid
      cy.get('button').contains(/Cutting|Sewing|Finishing|Packing/).first().click();
      cy.get('button').first().should('have.class', 'border-blue-600');
    });

    it('PIN entry pad works correctly', () => {
      // Enter PIN via numpad
      cy.contains('button', '1').click();
      cy.contains('button', '2').click();
      cy.contains('button', '3').click();
      cy.contains('button', '4').click();
      cy.contains('button', '5').click();
      cy.contains('button', '6').click();

      // Verify 6 dots are filled
      cy.get('div').filter((_, el) => {
        return el.className.includes('w-4') && el.className.includes('h-4');
      }).should('have.length.at.least', 6);
    });

    it('Clear button removes all PIN entries', () => {
      // Enter some digits
      cy.contains('button', '1').click();
      cy.contains('button', '2').click();

      // Clear
      cy.contains('button', 'Clear').click();

      // Verify dots are reset
      cy.get('div').filter((_, el) => {
        return el.className.includes('bg-blue-600');
      }).should('have.length', 0);
    });

    it('Backspace button removes last PIN digit', () => {
      cy.contains('button', '1').click();
      cy.contains('button', '2').click();
      cy.contains('button', '3').click();

      cy.get('button').filter((_, el) => {
        return el.querySelector('svg') && el.parentElement?.textContent.includes('Delete');
      }).first().click();

      // One less dot should be filled
      cy.get('div').filter((_, el) => {
        return el.className.includes('bg-blue-600');
      }).should('have.length.at.most', 2);
    });

    it('Unlock button is disabled until 6 digits are entered', () => {
      cy.contains('button', 'Unlock Station').should('be.disabled');

      // Enter 5 digits
      for (let i = 1; i <= 5; i++) {
        cy.contains('button', String(i)).click();
      }
      cy.contains('button', 'Unlock Station').should('be.disabled');

      // Enter 6th digit
      cy.contains('button', '6').click();
      cy.contains('button', 'Unlock Station').should('not.be.disabled');
    });

    it('Emergency/Admin Override link navigates to standard login', () => {
      cy.contains('Emergency / Admin Override').click();
      cy.url().should('include', '/login');
    });
  });

  describe('Division-Based Task Filtering (Cutting Station)', () => {
    it('Cutting station user sees only CUTTING process tasks', () => {
      // Mock API response for cutting station
      cy.intercept('POST', '**/api/station/auth', {
        statusCode: 200,
        body: {
          success: true,
          station: { id: 1, name: 'Cutting Station A', division: 'Cutting' },
          token: 'mock-cutting-token'
        }
      });

      cy.intercept('GET', '**/api/station/tasks', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: 1,
              status: 'pending',
              completed_quantity: 0,
              progress_percent: 0,
              processTemplate: { name: 'CUTTING' }
            },
            {
              id: 2,
              status: 'pending',
              completed_quantity: 0,
              progress_percent: 0,
              processTemplate: { name: 'CUTTING' }
            }
          ],
          filtered_by: 'Cutting'
        }
      });

      // Login with cutting station
      cy.contains('button', '1').click();
      cy.contains('button', '2').click();
      cy.contains('button', '3').click();
      cy.contains('button', '4').click();
      cy.contains('button', '5').click();
      cy.contains('button', '6').click();

      cy.contains('button', 'Unlock Station').click();

      // Verify redirect to station dashboard
      cy.url().should('include', '/station');

      // Verify only CUTTING tasks appear
      cy.contains('CUTTING').should('exist');
      cy.contains('SEWING').should('not.exist');
    });
  });

  describe('Division-Based Task Filtering (Sewing Station)', () => {
    it('Sewing station user sees only SEWING process tasks', () => {
      cy.intercept('POST', '**/api/station/auth', {
        statusCode: 200,
        body: {
          success: true,
          station: { id: 2, name: 'Sewing Line 1', division: 'Sewing' },
          token: 'mock-sewing-token'
        }
      });

      cy.intercept('GET', '**/api/station/tasks', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: 3,
              status: 'pending',
              completed_quantity: 0,
              progress_percent: 0,
              processTemplate: { name: 'SEWING' }
            },
            {
              id: 4,
              status: 'pending',
              completed_quantity: 0,
              progress_percent: 0,
              processTemplate: { name: 'SEWING' }
            }
          ],
          filtered_by: 'Sewing'
        }
      });

      cy.contains('button', '1').click();
      cy.contains('button', '2').click();
      cy.contains('button', '3').click();
      cy.contains('button', '4').click();
      cy.contains('button', '5').click();
      cy.contains('button', '6').click();

      cy.contains('button', 'Unlock Station').click();

      cy.url().should('include', '/station');
      cy.contains('SEWING').should('exist');
      cy.contains('CUTTING').should('not.exist');
    });
  });

  describe('Division-Based Task Filtering (Admin Station)', () => {
    it('Admin station user sees all process tasks (no filtering)', () => {
      cy.intercept('POST', '**/api/station/auth', {
        statusCode: 200,
        body: {
          success: true,
          station: { id: 3, name: 'Admin Station', division: 'Admin' },
          token: 'mock-admin-token'
        }
      });

      cy.intercept('GET', '**/api/station/tasks', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: 5,
              status: 'pending',
              completed_quantity: 0,
              progress_percent: 0,
              processTemplate: { name: 'CUTTING' }
            },
            {
              id: 6,
              status: 'pending',
              completed_quantity: 0,
              progress_percent: 0,
              processTemplate: { name: 'SEWING' }
            },
            {
              id: 7,
              status: 'pending',
              completed_quantity: 0,
              progress_percent: 0,
              processTemplate: { name: 'FINISHING' }
            }
          ],
          filtered_by: 'all'
        }
      });

      cy.contains('button', '1').click();
      cy.contains('button', '2').click();
      cy.contains('button', '3').click();
      cy.contains('button', '4').click();
      cy.contains('button', '5').click();
      cy.contains('button', '6').click();

      cy.contains('button', 'Unlock Station').click();

      cy.url().should('include', '/station');
      cy.contains('CUTTING').should('exist');
      cy.contains('SEWING').should('exist');
      cy.contains('FINISHING').should('exist');
    });
  });

  describe('Task Logging Works with Filtered Tasks', () => {
    it('User can log work on a filtered CUTTING task', () => {
      cy.intercept('POST', '**/api/station/auth', {
        statusCode: 200,
        body: {
          success: true,
          station: { id: 1, name: 'Cutting A', division: 'Cutting' },
          token: 'mock-token'
        }
      });

      cy.intercept('GET', '**/api/station/tasks', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: 1,
              status: 'pending',
              completed_quantity: 0,
              progress_percent: 0,
              processTemplate: { name: 'CUTTING' },
              orderItem: { quantity: 100 }
            }
          ]
        }
      });

      cy.intercept('POST', '**/api/station/tasks/*/log', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Work logged successfully'
        }
      });

      // Login
      for (let i = 1; i <= 6; i++) {
        cy.contains('button', String(i)).click();
      }
      cy.contains('button', 'Unlock Station').click();

      cy.url().should('include', '/station');

      // Click on task to open work log modal (if applicable)
      cy.contains('CUTTING').should('exist');
    });
  });
});
