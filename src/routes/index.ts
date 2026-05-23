import { Router } from "express";
import { authRoute } from "../modules/auth/auth.route";
import { issueRoute } from "../modules/issues/issue.route";

const router = Router();

const moduleRoutes = [
  { path: "/auth", route: authRoute },
  { path: "/issues", route: issueRoute },
];

moduleRoutes.forEach(({ path, route }) => {
  router.use(path, route);
});

export default router;
