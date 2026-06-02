const { userSchema } = require("../validation/userSchema");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const { task } = require("../db/prisma");

// ************USER SCHEMA TESTS********************
describe("user object validation tests", () => {
  //1. Test password is not a simple password
  it("1. doesn't permit a trivial password", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob@sample.com", password: "password" },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key == "password"),
    ).toBeDefined();
  });
  //2. The user schema requires that an email be specified.`
  it("2. The user schema requires that an email be specified.", () => {
    const { error } = userSchema.validate(
      { name: "Bob", password: "StrongPass123!" },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key === "email"),
    ).toBeDefined();
  });

  // 3. The user schema does not accept an invalid email.
  it("3. The user schema does not accept an invalid email.", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "not-an-email", password: "StrongPassword123!" },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key === "email"),
    ).toBeDefined();
  });

  // 4. The user schema requires a password.
  it("4. The user schema requires a password.", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob@sample.com" },
      {
        abortEarly: false,
      },
    );
    expect(
      error.details.find((detail) => detail.context.key === "password"),
    ).toBeDefined();
  });

  // 5. The user schema requires name.
  it("5. The user schema requires name.", () => {
    const { error } = userSchema.validate(
      { email: "bob@sample.com", password: "StrongPassword123!" },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key === "name"),
    ).toBeDefined();
  });

  // 6. The name must be valid (3 to 30 characters).
  it("6. The name must be valid (3 to 30 characters).", () => {
    const { error } = userSchema.validate(
      { name: "Bo", email: "bob@sample.com", password: "StrongPassword123!" },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key === "name"),
    ).toBeDefined();
  });

  // 7. If validation is performed on a valid user object, error comes back falsy.
  it("7. If validation is performed on a valid user object, error comes back falsy.", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob@sample.com", password: "StrongPassword123!" },
      { abortEarly: false },
    );
    expect(error).toBeFalsy();
  });
});

// ************TASK SCHEMA TESTS********************

// Create another describe stanza for taskSchema, with the following tests:
describe("task object validation tests", () => {
  // 8. The task schema requires a title.
  it("8. The task schema requires a title.", () => {
    const { error } = taskSchema.validate(
      { isCompleted: "false" },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key === "title"),
    ).toBeDefined();
  });

  // 9. If an isCompleted value is specified, it must be valid.
  it("9. If an isCompleted value is specified, it must be valid.", () => {
    const { error } = taskSchema.validate(
      { title: "chores", isCompleted: "not-boolean" },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key === "isCompleted"),
    ).toBeDefined();
  });

  // 10. If an isCompleted value is not specified but the rest of the object is valid, a default of false is provided by validation.
  it("10. If an isCompleted value is not specified but the rest of the object is valid, a default of false is provided by validation.", () => {
    const { error } = taskSchema.validate(
      { title: "chores" },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key === "isCompleted"),
    ).toBe(false);
  });

  // 11. If isCompleted in the provided object has the value true, it remains true after validation.
  it("11. If isCompleted in the provided object has the value true, it remains true after validation.", () => {
    const { error } = taskSchema.validate(
      { title: "chores", isCompleted: true },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key === "isCompleted"),
    ).toBe(true);
  });
});

// ************PATCH TASK SCHEMA TESTS********************
// Create another describe() stanza for the patchTaskSchema.
describe("patch object validation tests", () => {
  // 12. The patchTaskSchema does not require a title.
  it("12. The patchTaskSchema does not require a title.", () => {
    const { error } = patchTaskSchema.validate(
      { isCompleted: true },
      { abortEarly: false },
    );
    expect(error).toBeFalsy();
  });

  // 13. If no value is provided for isCompleted this remains undefined in the returned value.
  it("13. If no value is provided for isCompleted this remains undefined in the returned value.", () => {
    const { error } = patchTaskSchema.validate(
      { title: "Updated Title" },
      { abortEarly: false },
    );
    expect(value.isCompleted).toBeUndefined();
  });
});
