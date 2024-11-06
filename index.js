const inquirer= require("inquirer")
const { printTable } = require('console-table-printer');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool(
  {
    user: process.env.USER_NAME,
    password: process.env.PASSWORD,
    host: 'localhost',
    port: 5432,
    database: process.env.DBNAME
  },
  console.log(`Connected to the books_db database.`)
)

pool.connect(()=>{
  mainMenu()
});


function mainMenu () {
  inquirer.prompt([
    {
      type:"list",
      message: "What would you like to do?",
      name:"menu",
      choices:["view all departments", "view all roles", "view all employees", "add a department", "add a role", "add an employee", "update an employee role"]
    }
  ])
  .then(response => {
    if (response.menu === "view all departments") {
      viewDepartments();
    }
    else if (response.menu === "view all roles") {
      viewRoles();
    }
    else if (response.menu === "view all employees") {
      viewEmployees();
    }
    else if (response.menu === "add a department") {
      addDepartment();
    }
    else if (response.menu === "add a role") {
      addRole();
    }
    else if (response.menu === "add an employee") {
      addEmployee();
    }
    else if (response.menu === "update an employee role") {
      updateEmployeeRole();
    }
  })
}

function viewEmployees() {
  pool.query("SELECT * FROM employee", (err, result) => {
      if (err) {
          console.error("Error executing query:", err);
          return mainMenu();
      }
      printTable(result.rows);
      mainMenu();
  });
}

function viewDepartments() {
  pool.query("SELECT * FROM department", (err, result) => {
      if (err) {
          console.error("Error executing query:", err);
          return mainMenu();
      }
      printTable(result.rows);
      mainMenu();
  });
}

function viewRoles() {
  pool.query("SELECT * FROM role", (err, result) => {
      if (err) {
          console.error("Error executing query:", err);
          return mainMenu();
      }
      printTable(result.rows);
      mainMenu();
  });
}

function addDepartment(){
  inquirer.prompt([
    {
      type: "input",
      message: "What is the name of the department?",
      name: "departmentName"
    }
  ])
  .then(response => {
    pool.query(`INSERT INTO department (name) VALUES ($1)`, 
    [response.departmentName], 
    (err) => {
      if (err) throw err;
      console.log("Department added successfully!");
      mainMenu();
    });
  });
}

function addRole(){
  pool.query("SELECT * FROM department", (err, {rows}) => {
    if (err) throw err;
    
    inquirer.prompt([
      {
        type: "input",
        message: "What is the name of the role?",
        name: "title"
      },
      {
        type: "input",
        message: "What is the salary for this role?",
        name: "salary"
      },
      {
        type: "list",
        message: "Which department does this role belong to?",
        name: "department_id",
        choices: rows.map(dept => ({
          name: dept.name,
          value: dept.id
        }))
      }
    ])
    .then(response => {
      pool.query(
        `INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)`,
        [response.title, response.salary, response.department_id],
        (err) => {
          if (err) throw err;
          console.log("Role added successfully!");
          mainMenu();
        }
      );
    });
  });
}

function addEmployee(){
  pool.query("SELECT * FROM role", (err, {rows: roles}) => {
    if (err) throw err;
    
    pool.query("SELECT * FROM employee", (err, {rows: employees}) => {
      if (err) throw err;

      inquirer.prompt([
        {
          type: "input",
          message: "What is the employee's first name?",
          name: "first_name"
        },
        {
          type: "input",
          message: "What is the employee's last name?",
          name: "last_name"
        },
        {
          type: "list",
          message: "What is the employee's role?",
          name: "role_id",
          choices: roles.map(role => ({
            name: role.title,
            value: role.id
          }))
        },
        {
          type: "list",
          message: "Who is the employee's manager?",
          name: "manager_id",
          choices: [
            { name: "None", value: null },
            ...employees.map(emp => ({
              name: `${emp.first_name} ${emp.last_name}`,
              value: emp.id
            }))
          ]
        }
      ])
      .then(response => {
        pool.query(
          `INSERT INTO employee (first_name, last_name, role_id, manager_id) 
           VALUES ($1, $2, $3, $4)`,
          [response.first_name, response.last_name, response.role_id, response.manager_id],
          (err) => {
            if (err) throw err;
            console.log("Employee added successfully!");
            mainMenu();
          }
        );
      });
    });
  });
}

function updateEmployeeRole() {
  pool.query("SELECT * FROM employee", (err, employees) => {
    if (err) throw err;
    
    pool.query("SELECT * FROM role", (err, roles) => {
      if (err) throw err;

      inquirer.prompt([
        {
          type: "list",
          message: "Which employee's role do you want to update?",
          name: "employee_id",
          choices: employees.rows.map(emp =>({
            name: `${emp.first_name} ${emp.last_name}`,
            value: emp.id
          }))
        },
        {
          type: "list",
          message: "Which role do you want to assign to the selected employee?",
          name: "role_id",
          choices: roles.rows.map(role => ({
            name: role.title,
            value: role.id
          }))
        }
      ])
      .then(response => {
        pool.query(
          "UPDATE employee SET role_id = $1 WHERE id = $2",
          [response.role_id, response.employee_id],
          (err) => {
            if (err) throw err;
            console.log("Employee role updated successfully!");
            mainMenu();
          }
        );
      });
    });
  });
}