module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // ✨ New feature
        'fix', // 🐛 Bug fix
        'docs', // 📝 Documentation
        'style', // 💄 Formatting, missing semi colons, etc
        'refactor', // ♻️ Code change that neither fixes a bug nor adds a feature
        'perf', // ⚡️ Performance improvements
        'test', // ✅ Adding tests
        'chore', // 🔧 Maintain
        'revert', // ⏪ Revert changes
        'build', // 📦 Build system or external dependencies
        'ci', // 👷 CI configuration files and scripts
      ],
    ],
    'subject-case': [0], // Không bắt buộc case
    'subject-max-length': [2, 'always', 100],
  },
};
