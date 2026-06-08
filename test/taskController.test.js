require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; // point to the test database!
const prisma = require("../db/prisma");
const httpMocks = require("node-mocks-http");
const {
  index,
  show,
  create,
  update,
  deleteTask,
} = require("../controllers/taskController");
const waitForRouteHandlerCompletion = require("./waitForHandlerCompletion");
const { EventEmitter } = require("events");

// a few useful globals
let user1 = null;
let user2 = null;
let saveRes = null;
let saveData = null;
let saveTaskId = null;

beforeAll(async () => {
  // clear database
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.User.deleteMany(); // delete all users
  user1 = await prisma.User.create({
    data: { name: "Bob", email: "bob@sample.com", hashedPassword: "nonsense" },
  });
  user2 = await prisma.User.create({
    data: {
      name: "Alice",
      email: "alice@sample.com",
      hashedPassword: "nonsense",
    },
  });
});

afterAll(() => {
  prisma.$disconnect();
});

// ************TEST CREATE TASK FUNCTION********************

describe("testing task creation", () => {
  it("14. cant create a task without a user id", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    expect.assertions(1);
    try {
      await waitForRouteHandlerCompletion(create, req, saveRes);
    } catch (e) {
      expect(e.name).toBe("TypeError");
    }
  });

  // 15. You can't create a task with a bogus user id.
  // In this case, you trigger a database constraint violation, because the foreign key is invalid.  The error thrown has a name of PrismaClientKnownRequestError.
  it("15. You can't create a task with a bogus user id.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "second task" },
    });

    req.user = { id: 99999 };

    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

    expect.assertions(1);

    try {
      await waitForRouteHandlerCompletion(create, req, saveRes);
    } catch (e) {
      expect(e.name).toBe("PrismaClientKnownRequestError");
    }
  });

  // 16. If you have a valid user id, create() succeeds (res.statusCode should be 201).
  // The res object you create for test 16 should be saved in saveRes, so that you can do subsequent tests on what is stored.
  it("16. If you have a valid user id, create() succeeds (res.statusCode should be 201).", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "third task" },
    });

    req.user = { id: user1.id };

    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

    await waitForRouteHandlerCompletion(create, req, saveRes);

    expect(saveRes.statusCode).toBe(201);
  });

  // 17. The object returned from the create() call has the expected title.
  // To do this, you need to do saveData = saveRes._getJSONData().  Then you can test what saveData contains.

  it("17. The object returned from the create() call has the expected title.", async () => {
    saveData = saveRes._getJSONData();
    expect(saveData.title).toBe("third task");
  });

  // 18. The object has the right value for isCompleted.
  it("18. The object has the right value for isCompleted.", async () => {
    expect(saveData.isCompleted).toBe(false);
  });

  // 19. The object does not have any value for userId.
  // Save the id value from the object in saveTaskId.  You'll need it below.
  it("19. The object does not have any value for userId.", async () => {
    saveTaskId = saveData.id;
    expect(saveTaskId.userId).toBeUndefined();
  });
});

// ************TEST GET ALL TASK FUNCTION********************
// Note: You should not use the same res object for multiple controller calls, because there will be unwanted state preserved inside of the res.  Create a new one when you need to call the controller again.

// Create a new describe stanza called "test getting created tasks" and test the following.
describe("test getting created tasks", () => {
  // 20. You can't get a list of tasks without a user id.
  it("20. You can't get a list of tasks without a user id.", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });

    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

    expect.assertions(1);

    try {
      await waitForRouteHandlerCompletion(index, req, saveRes);
    } catch (error) {
      expect(error.name).toBe("TypeError");
    }
  });

  // 21. If you use user1's id, the call returns a 200 status.
  it("21. If you use user1's id, the call returns a 200 status.", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });

    req.user = { id: user1.id };

    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

    await waitForRouteHandlerCompletion(index, req, saveRes);

    expect(saveRes.statusCode).toBe(200);
  });

  // 22. The returned object has a tasks array of length 1.
  it("22. The returned object has a tasks array of length 1.", async () => {
    saveData = saveRes._getJSONData(); // reusing saveRes
    expect(saveData.tasks.length).toBe(1);
  });

  // 23. The title in the first array object is as expected.
  // You are checking saveData.tasks[0].title.
  it("23. The title in the first array object is as expected.", async () => {
    expect(saveData.tasks[0].title).toBe("third task");
  });

  // 24. The first array object does not contain a userId.
  it("24. The first array object does not contain a userId.", async () => {
    expect(saveData.tasks[0].userId).toBeUndefined();
  });

  // 25. If you get the list of tasks using the userId from user2, you get a 404.
  // (This is a security test for access control!  You do not want Alice to access Bob's data!)
  it("25. If you get the list of tasks using the userId from user2, you get a 404.", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });

    req.user = { id: user2.id };

    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

    await waitForRouteHandlerCompletion(index, req, saveRes);

    expect(saveRes.statusCode).toBe(404);
  });

  // ************TEST SHOW TASKS FUNCTION********************

  // 26. You can retrieve the created task using show().
  // Hint: You have to set req.params.  You want req.params.id to be a string representation of saveTaskId:

  // req.params = { id: saveTaskId.toString() }
  // You can just check for a 200 result code.

  it("26. You can retrieve the created task using show().", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });

    req.user = { id: user1.id };
    req.params = { id: saveTaskId.toString() };

    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

    await waitForRouteHandlerCompletion(show, req, saveRes);

    expect(saveRes.statusCode).toBe(200);
  });

  // 27. User2 can't retrieve this task entry. You should get a 404.
  // (Why test this? We don't use this operation in the app -- but we have to test it, as it could be a back door.)
  it("27. User2 can't retrieve this task entry. You should get a 404.", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });

    req.user = { id: user2.id };
    req.params = { id: saveTaskId.toString() };

    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

    await waitForRouteHandlerCompletion(show, req, saveRes);

    expect(saveRes.statusCode).toBe(404);
  });
});

// ************TEST UPDATE AND DELETE TASK FUNCTION********************

// Create another stanza for testing the update and delete of tasks.

describe("testing the update and delete of tasks", () => {
  // 28. User1 can set the task corresponding to saveTaskId to isCompleted: true.
  it("28. User1 can set the task corresponding to saveTaskId to isCompleted: true.", async () => {
    const req = httpMocks.createRequest({
      method: "PATCH",
      body: { isCompleted: true },
    });

    req.user = { id: user1.id };
    req.params = { id: saveTaskId.toString() };

    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

    await waitForRouteHandlerCompletion(update, req, saveRes);

    expect(saveRes.statusCode).toBe(200);
  });
  // 29. User2 can't do this.
  it("29. User2 can't do this.", async () => {
    const req = httpMocks.createRequest({
      method: "PATCH",
      body: { isCompleted: false },
    });

    req.user = { id: user2.id };
    req.params = { id: saveTaskId.toString() };

    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

    await waitForRouteHandlerCompletion(update, req, saveRes);

    expect(saveRes.statusCode).toBe(404);
  });

  // 30. User2 can't delete this task.
  it("30. User2 can't delete this task.", async () => {
    const req = httpMocks.createRequest({
      method: "DELETE",
    });

    req.user = { id: user2.id };
    req.params = { id: saveTaskId.toString() };

    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

    await waitForRouteHandlerCompletion(deleteTask, req, saveRes);

    expect(saveRes.statusCode).toBe(404);
  });

  // 31. User1 can delete this task.
  it("31. User1 can delete this task.", async () => {
    const req = httpMocks.createRequest({
      method: "DELETE",
    });

    req.user = { id: user1.id };
    req.params = { id: saveTaskId.toString() };

    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

    await waitForRouteHandlerCompletion(deleteTask, req, saveRes);

    expect(saveRes.statusCode).toBe(200);
  });

  // 32. Retrieving user1's tasks now returns a 404.
  it("32. Retrieving user1's tasks now returns a 404.", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });

    req.user = { id: user1.id };

    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

    await waitForRouteHandlerCompletion(index, req, saveRes);

    expect(saveRes.statusCode).toBe(404);
  });
});
