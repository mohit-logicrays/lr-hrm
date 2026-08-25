import * as userService from "./user.service.js";
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendList,
} from "../../core/responses/apiResponse.js";

export async function listUsers(req, res) {
  const { items, total, page, pageSize } = await userService.listUsers(req);
  return sendList(res, { items, total, page, pageSize, message: "Users retrieved" });
}

export async function getUser(req, res) {
  const user = await userService.getUserById(req.params.id);
  return sendSuccess(res, { message: "User retrieved", data: user });
}

export async function createUser(req, res) {
  const data = await userService.createUser(req.user, req.body);
  return sendCreated(res, {
    message: data.emailSent
      ? "User created. Credentials emailed."
      : "User created, but the credentials email failed to send.",
    data,
  });
}

export async function adminUpdateUser(req, res) {
  const user = await userService.adminUpdateUser(req.user, req.params.id, req.body);
  return sendSuccess(res, { message: "User updated", data: user });
}

export async function deleteUser(req, res) {
  await userService.deleteUser(req.user, req.params.id);
  return sendNoContent(res);
}

export async function updateProfile(req, res) {
  const user = await userService.updateOwnProfile(req.user._id, req.body);
  return sendSuccess(res, { message: "Profile updated", data: user });
}
