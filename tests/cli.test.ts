import { createProgram } from "../src/cli";

function parse(args: string[]) {
  const dev = jest.fn();
  const build = jest.fn();
  createProgram({ dev, build }).exitOverride().parse(args, { from: "user" });
  return { dev, build };
}

describe("CLI option parsing", () => {
  it.each([
    [["dev", "--port", "3002"], { port: "3002" }],
    [["--port", "3002"], { port: "3002" }],
    [["dev", "-p", "3002"], { port: "3002" }],
    [["dev", "--reload", "--port", "3002"], { port: "3002", reload: true }],
    [["--reload", "--port", "3002"], { port: "3002", reload: true }],
    [["dev", "--debug"], { port: "3000", debug: true }],
    [["--debug"], { port: "3000", debug: true }],
    [["dev", "-r", "-d"], { port: "3000", reload: true, debug: true }],
    [["dev"], { port: "3000" }],
    [[], { port: "3000" }],
  ])("typeflow %j passes %j to dev", (args, expected) => {
    const { dev, build } = parse(args);
    expect(dev).toHaveBeenCalledTimes(1);
    expect(dev.mock.calls[0][0]).toEqual(expected);
    expect(build).not.toHaveBeenCalled();
  });

  it("passes build options to build", () => {
    const { dev, build } = parse(["build", "--minify", "--debug"]);
    expect(dev).not.toHaveBeenCalled();
    expect(build.mock.calls[0][0]).toEqual({ minify: true, debug: true });
  });
});
