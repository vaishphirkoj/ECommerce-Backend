class ApiFeaturs {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  search() {
    const keyword = this.queryStr.keyword
      ? {
          name: {
            $regex: this.queryStr.keyword,
            $options: "i",
          },
        }
      : {};

    // console.log(keyword);
    this.query = this.query.find({ ...keyword });
    return this;
  }

  //FOR CATEGOEY
  filter() {
    const queryCopy = { ...this.queryStr };
    // console.log(queryCopy);

    //REMOVING SOME FEILDS FOR CATEGORY
    const removeFeilds = ["keyword", "page", "limit"];
    removeFeilds.forEach((key) => delete queryCopy[key]);
    // console.log(queryCopy);

    //FILTER FOR PRICE AND RATING
    let queryStr = JSON.stringify(queryCopy);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  //PAGINATION
  pagination(resultPerPage) {
    const currentPage = Number(this.queryStr.page) || 1;
    const skip = resultPerPage * (currentPage - 1);
    this.query = this.query.limit(resultPerPage).skip(skip);
    return this;
  }
}

module.exports = ApiFeaturs;
