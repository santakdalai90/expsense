import { ObjectId } from "mongodb";

let movies;

export default class MoviesDAO {
    static async injectDB(conn) {
        if (movies) {
            return;
        }
        try {
            movies = await conn
                .db(process.env.MOVIEREVIEWS_NS)
                .collection("movies");
        } catch (e) {
            console.error(
                `Unable to establish a collection handle in moviesDAO: ${e}`,
            );
        }
    }

    static async getMovies({
        filters = null,
        page = 0,
        moviesPerPage = 20,
    } = {}) {
        let query;
        if (filters) {
            if ("title" in filters) {
                query = { $text: { $search: filters["title"] } };
            } else if ("rated" in filters) {
                query = { rated: { $eq: filters["rated"] } };
            }
        }
        let cursor;
        try {
            cursor = await movies
                .find(query)
                .limit(moviesPerPage)
                .skip(moviesPerPage * page);
            const moviesList = await cursor.toArray();
            const totalNumMovies = await movies.countDocuments(query);
            return { moviesList, totalNumMovies };
        } catch (e) {
            console.error(`Unable to get movies: ${e}`);
            return { moviesList: [], totalNumMovies: 0 };
        }
    }

    static async getMovieById(id) {
        try {
            return await movies
                .aggregate([
                    {
                        $match: {
                            _id: new ObjectId(id),
                        },
                    },
                    {
                        $lookup: {
                            from: "reviews",
                            localField: "_id",
                            foreignField: "movie_id",
                            as: "reviews",
                        },
                    },
                ])
                .next();
        } catch (e) {
            console.error(`Unable to get movie by id: ${e}`);
            throw e;
        }
    }

    static async getRatings() {
        try {
            return await movies.distinct("rated");
        } catch (e) {
            console.error(`unable to get ratings: ${e}`);
            throw e;
        }
    }
}
