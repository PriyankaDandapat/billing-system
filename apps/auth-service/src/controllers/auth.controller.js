const authService = require("../services/auth.service");
const { generateToken } = require("../utils/token");

exports.signup = async (req, res) => {
  try {
    const { email, password, firstname, lastname, dob } = req.body;

    const user = await authService.signup(
      email,
      password,
      firstname,
      lastname,
      dob,
    );

    res.status(201).json({ user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await authService.login(email, password);
    const token = generateToken(user);

    res.json({ token });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
