const paginate = async (model, page, limit, query = {}) => {
    // Convert page and limit to integers
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 10;

    // Calculate the starting and ending index
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    // Get total count of documents
    const total = await model.countDocuments(query);

    const pagination = {};

    // If there are more results after the current page
    if (endIndex < total) {
        pagination.next = {
            page: page + 1,
            limit
        };
    }

    // If there are results before the current page
    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit
        };
    }

    const results = await model.find(query).skip(startIndex).limit(limit);

    return {
        success: true,
        count: results.length,
        total,
        pagination,
        data: results
    };
};

module.exports = paginate;
