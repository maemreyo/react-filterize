# Contributing to React Dynamic Form

Thank you for your interest in contributing to React Dynamic Form! We welcome contributions from everyone.

## Getting Started

1. **Fork the repository** to your own GitHub account.
2. **Clone the forked repository** to your local machine:

   ```bash
   git clone https://github.com/<your-username>/react-dynamic-form.git
   ```

   Replace `<your-username>` with your GitHub username.

3. **Install dependencies:**

   ```bash
   cd react-dynamic-form
   yarn install
   ```

## Development Workflow

1. **Create an issue:** Before making any significant changes, please create an issue on the main repository to discuss the proposed changes. This will help ensure that your work is aligned with the project's goals and avoid any duplication of effort.
2. **Create a branch:** Create a new branch for your changes, based on the `main` branch:

   ```bash
   git checkout -b feat/your-feature-name
   ```

   Use a descriptive branch name, such as `feat/add-color-input` or `fix/validation-issue`.

3. **Make your changes:** Implement your feature or bug fix, following the coding conventions (see below).
4. **Write tests:** Write unit tests to cover your changes. You can run the tests with:

   ```bash
   yarn test
   ```

5. **Format your code:**

   ```bash
   yarn lint:fix
   ```

   This will automatically fix linting errors and format your code according to the project's style guide.

6. **Commit your changes:** Write a clear and concise commit message, following the [Conventional Commits](https://www.conventionalcommits.org/) specification. Example:

   ```bash
   git commit -m "feat: add color input type"
   ```

7. **Push your branch** to your forked repository:

   ```bash
   git push -u origin feat/your-feature-name
   ```

8. **Create a pull request:** Go to the main repository on GitHub and create a pull request from your branch to the `main` branch. Provide a detailed description of your changes and reference the issue you created earlier.

## Coding Conventions

- We use **ESLint** and **Prettier** to enforce code style. Please make sure your code passes linting before submitting a pull request.
- We use **TypeScript** for type safety.
- Write clear and concise code that is easy to understand and maintain.
- Comment your code where necessary.
- Write unit tests to cover your changes.
- Follow **React best practices**.

## Building and Testing

- **Build:** `yarn build`
- **Test:** `yarn test`
- **Lint:** `yarn lint`
- **Format:** `yarn lint:fix`
- **Run Storybook:** `yarn storybook`
- **Build Storybook:** `yarn build-storybook`

## Pull Request Guidelines

- Make sure your pull request is based on the `main` branch.
- Provide a clear and concise description of your changes.
- Reference the issue that your pull request addresses.
- Make sure your code passes all tests and linting checks.
- Be responsive to feedback from reviewers.

## Code of Conduct

Please note that this project has a [Code of Conduct](./CODE_OF_CONDUCT.md). We expect all contributors to adhere to it.

## Questions

If you have any questions, please feel free to reach out to us by creating an issue on the repository.

Thank you for contributing!
