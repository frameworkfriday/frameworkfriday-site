import { getUserFeedback } from "./actions";
import FeedbackClient from "./FeedbackClient";

export default async function FeedbackPage() {
  const feedbackItems = await getUserFeedback();

  return <FeedbackClient initialFeedback={feedbackItems} />;
}
