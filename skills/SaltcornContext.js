const Table = require("@saltcorn/data/models/table");
const View = require("@saltcorn/data/models/view");
const Page = require("@saltcorn/data/models/page");
const Trigger = require("@saltcorn/data/models/trigger");

class SaltcornContextSkill {
  static skill_name = "Saltcorn Context";

  get skill_label() {
    return "Saltcorn Context";
  }

  constructor(cfg) {
    Object.assign(this, cfg);
  }

  static async configFields() {
    return [];
  }

  systemPrompt() {
    return "If you need to understand the configuration, code, or structure of an existing Saltcorn object (such as a view, table, page, or trigger) to have full context, use the get_saltcorn_metadata tool to read it. Specially useful for understanding jscodeview views or existing data schemas. If you are unsure of the exact name of an object, use list_saltcorn_objects to see all available objects of that type.";
  }

  provideTools = () => {
    return [
      {
        type: "function",
        process: async (row) => {
          const { object_type, name } = row;
          let result;
          try {
            switch (object_type) {
              case "Table":
                result = await Table.findOne({ name });
                break;
              case "View":
                result = await View.findOne({ name });
                break;
              case "Page":
                result = await Page.findOne({ name });
                break;
              case "Trigger":
                result = await Trigger.findOne({ name });
                break;
              default:
                return `Unknown object type: ${object_type}`;
            }
            if (!result) {
              return `No ${object_type} found with name: ${name}`;
            }
            // Remove bulky cyclical structures if any, and return JSON representation
            return JSON.stringify(result.toJson ? result.toJson() : result, null, 2);
          } catch (e) {
            return `Error retrieving metadata: ${e.message}`;
          }
        },
        function: {
          name: "get_saltcorn_metadata",
          description: "Get the configuration metadata of a Saltcorn object to understand its code and structure.",
          parameters: {
            type: "object",
            required: ["object_type", "name"],
            properties: {
              object_type: {
                description: "The type of the Saltcorn object to retrieve.",
                type: "string",
                enum: ["Table", "View", "Page", "Trigger"],
              },
              name: {
                description: "The exact name of the object.",
                type: "string",
              },
            },
          },
        },
      },
      {
        type: "function",
        process: async (row) => {
          const { object_type } = row;
          try {
            let objects;
            switch (object_type) {
              case "Table":
                objects = await Table.find();
                break;
              case "View":
                objects = await View.find();
                break;
              case "Page":
                objects = await Page.find();
                break;
              case "Trigger":
                objects = await Trigger.find();
                break;
              default:
                return `Unknown object type: ${object_type}`;
            }
            return (objects.map((obj) => obj.name || obj.label).filter(Boolean).join(", ")) || "No objects found.";
          } catch (e) {
            return `Error listing objects: ${e.message}`;
          }
        },
        function: {
          name: "list_saltcorn_objects",
          description: "List the names of all Saltcorn objects of a certain type.",
          parameters: {
            type: "object",
            required: ["object_type"],
            properties: {
              object_type: {
                description: "The type of the Saltcorn objects to list.",
                type: "string",
                enum: ["Table", "View", "Page", "Trigger"],
              },
            },
          },
        },
      },
    ];
  };
}

module.exports = SaltcornContextSkill;
