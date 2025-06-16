const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-4">
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 rounded-full font-medium transition-colors duration-200
            ${
              currentPage === page
                ? "bg-[#219377] text-white shadow-md"
                : "bg-white border border-[#ffbd59] text-[#219377] hover:bg-[#ffbd59] hover:text-white"
            }`}
        >
          {page}
        </button>
      ))}
    </div>
  );
};

export default Pagination;
