const FeedbackPage = () => {
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Give Feedback</h1>
      <p className="text-gray-600 mb-4">We’d love to hear from you.</p>
      <form className="space-y-4">
        <textarea
          className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#219377]"
          rows="5"
          placeholder="Type your feedback here..."
        ></textarea>
        <button
          type="submit"
          className="px-6 py-2 bg-[#219377] text-white rounded-xl hover:bg-[#1c7e67]"
        >
          Submit Feedback
        </button>
      </form>
    </div>
  );
};

export default FeedbackPage;
