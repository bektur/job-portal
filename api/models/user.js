const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  first_name: { type: String, required: true, maxLength: 100 },
  last_name: { type: String, required: true, maxLength: 100 },
  email: { type: String, required: true, minLength: 5 },
  password: { type: String, trim: true },
  user_role: {type: Number}
});

UserSchema.pre('save', async function(next) {
  const user = this;

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
})

// Virtual for author's full name
UserSchema.virtual('name').get(function () {
  // To avoid errors in cases where an author does not have either a family name or first name
  // We want to make sure we handle the exception by returning an empty string for that case
  let fullname = '';
  if (this.first_name && this.last_name) {
    fullname = `${this.last_name}, ${this.first_name}`;
  }
  if (!this.first_name || !this.last_name) {
    fullname = '';
  }
  return fullname;
});

// Export model
module.exports = mongoose.model('User', UserSchema);
