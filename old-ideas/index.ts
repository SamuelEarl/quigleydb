// These are old ideas that were going to use SurrealQL.


const space = "\x20";
let objStr = ``;
let nestedObjDepth = 1;


// function formatObjToStringOfProps(obj) {
//   return Object.entries(obj).map(([key, value]) => `${space.repeat(2)}${key}: ${value}`).join(`,\n`);
// }

/**
 * Recursively iterate through nested objects and create a string for any object properties.
 * This is used for query statements like the CONTENT statement.
 * Source: https://stackoverflow.com/a/54272512/9453009.
 * @param obj
 */
function iterate(obj) {
  const props = Object.keys(obj);
  props.forEach((key, index) => {
    const value = obj[key];
    // For any nested objects, add the key name, increment the `nestedObjDepth` by 1, and call this function again with the nested object.
    if (typeof value === "object" && value !== null) {
      objStr = objStr + `${space.repeat(4 + (2 * nestedObjDepth))}${key}: `;
      nestedObjDepth += 1;
      iterate(value);
    }
    // For all other properties...
    else {
      // Add an opening bracket before any props in the current object.
      if (index === 0) {
        objStr = objStr + `{\n`;  
      }

      // Add a key and placeholder value for query parameters.
      objStr = objStr + `${space.repeat(4 + (2 * nestedObjDepth))}${key}: $${key}`;

      // Add an ending comma and new line character to the end of each prop, except for the last prop in the object.
      if (index !== props.length - 1) {
        objStr = objStr + `,\n`;
      }
    }
  });
}

function addClosingBrackets() {
  for (let i = nestedObjDepth; i > 0; i--) {
    objStr = objStr + `\n${space.repeat(2 + (2 * i))}}`;
  }
}


/**
 * This function will format a CREATE query string.
 * @param obj 
 */
function create(obj) {
  const id = Math.random().toString(36).slice(2);
  const node = obj.node;

  // Reset `objStr` to its original value.
  objStr = ``;

  iterate(obj.props);

  addClosingBrackets();

  const queryString = `LET $create${id} = (
    CREATE ${node} CONTENT ${objStr}
  );`;
  console.log(queryString);
}

export function query(arr) {
  for (let i = 0; i < arr.length; i++) {
    // console.log("ARR:", arr[i]);
    for (const key in arr[i]) {
      const queryType = key.toUpperCase();
      if (queryType === "CREATE") {
        create(arr[i][key]);
      }
      // console.log("NESTED OBJ:", key, arr[i][key]);
    }
  }
}

// const newUser = await db.query(`
//   BEGIN TRANSACTION;

//   LET $newUser = (CREATE User CONTENT {
//     authServerUserId: $authServerUserId,
//     avatar: "",
//     createdAt: $timestamp,
//     email: $email,
//     firstName: $firstName,
//     lastName: $lastName,
//     preferredName: "",
//     preferences: {
//       budgetLayout: "table",
//       theme: "light"
//     }
//   });

//   COMMIT TRANSACTION;
//   `,
//   {
//     timestamp: timestamp,
//     authServerUserId: "kindeUserProfile.id",
//     firstName: "John",
//     lastName: "Doe",
//     email: "john@example.com",
//   }
// );

// Take this query and convert it to the SurrealQL query string.
// TODO: Update the `query()` function after I finish designing the query language in the README.
const timestamp = new Date().toISOString();

const result = query([
  {
    create: {
      node: "User",
      props: {
        authServerUserId: "kindeUserProfile.id",
        avatar: "",
        createdAt: timestamp,
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
        preferredName: "",
        preferences: {
          budgetLayout: "table",
          theme: "light"
        },
      },
    },
  },
]);


// const result = query([
//   {
//     create: {
//       node: "User",
//       props: {
//         authServerUserId: $authServerUserId,
//         avatar: "",
//         createdAt: $timestamp,
//         email: $email,
//         firstName: $firstName,
//         lastName: $lastName,
//         preferredName: "",
//         preferences: {
//           budgetLayout: "table",
//           theme: "light"
//         },
//         director: {
//           edge: "->DIRECTED->",
//           node: "Person",
//           props: {
//             name: "Sam Raimi",
//           },
//         },
//       }
//     },
//   }
// ]);
