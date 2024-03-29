const Product = require('../models/productModel')
const asyncHandler = require('express-async-handler')
const slugify = require('slugify')
const makeSKU = require('uniqid')

const createProduct = asyncHandler(async (req, res) => {
	const { title, price, description, brand, category, color } = req.body
	const thumb = req?.files?.thumb[0]?.path
	const images = req.files?.images?.map(el => el.path)
	if (!(title && price && description && brand && category && color))
		throw new Error('Missing inputs')

	req.body.slug = slugify(title)

	if (thumb) req.body.thumb = thumb
	if (images) req.body.images = images

	const newProduct = await Product.create(req.body)

	return res.status(200).json({
		success: newProduct ? true : false,
		mes: newProduct ? 'Created' : 'Failed.',
	})
})

const getProduct = asyncHandler(async (req, res) => {
	const { pid } = req.params

	const product = await Product.findById(pid).populate({
		path: 'rating',
		populate: {
			path: 'postedBy',
			select: 'firstName lastName avatar',
		},
	})

	return res.status(200).json({
		success: product ? true : false,
		productData: product ? product : "Can't get product",
	})
})

// Filtering, sorting & pagination
const getProducts = asyncHandler(async (req, res) => {
	const queries = { ...req.query }

	// tách các trường đặt biệt ra khỏi query
	const excludeFields = ['limit', 'sort', 'page', 'fields']

	// xóa những trường excludeFields ra khỏi query
	excludeFields.forEach(el => delete queries[el])

	// format lại các operators cho đúng cú pháp mongoose
	let queryString = JSON.stringify(queries)
	// thay thế các từ đơn như "gte", "gt", "lt", "lte" => dạng "$gte", "$gt", "$lt", "$lte"
	queryString = queryString.replace(
		// biểu thức chính quy sử dụng để tìm các từ đơn ("gte", "gt", "lt", "lte") nằm độc lập giữa các ranh giới từ
		/\b(gte|gt|lt|lte)\b/g,
		macthedEl => `$${macthedEl}`,
	)
	const formatedQueries = JSON.parse(queryString)
	let colorQueryObject = {}

	// filtering
	if (queries?.title)
		formatedQueries.title = {
			$regex: queries.title,
			$options: 'i', // tìm kiếm không phân biệt chữ hoa chữ thường trong quá trình tìm kiếm theo mẫu
		}
	if (queries?.category)
		formatedQueries.category = {
			$regex: queries.category,
			$options: 'i', // tìm kiếm không phân biệt chữ hoa chữ thường trong quá trình tìm kiếm theo mẫu
		}
	if (queries?.brand)
		formatedQueries.brand = {
			$regex: queries.brand,
			$options: 'i', // tìm kiếm không phân biệt chữ hoa chữ thường trong quá trình tìm kiếm theo mẫu
		}
	if (queries?.color) {
		delete formatedQueries.color
		const colorArr = queries.color?.split(',')
		const colorQuery = colorArr.map(el => ({
			color: { $regex: el, $options: 'i' },
		}))
		colorQueryObject = { $or: colorQuery }
	}
	let queryObject = {}
	if (queries?.q) {
		delete formatedQueries.q

		queryObject = {
			$or: [
				{ color: { $regex: queries.q, $options: 'i' } },
				{ title: { $regex: queries.q, $options: 'i' } },
				{ category: { $regex: queries.q, $options: 'i' } },
				{ brand: { $regex: queries.q, $options: 'i' } },
				// { description: { $regex: queries.q, $options: 'i' } },
			],
		}
	}

	const query = { ...colorQueryObject, ...formatedQueries, ...queryObject }

	let queryCommand = Product.find(query)

	// sorting
	if (req.query.sort) {
		const sortBy = req.query.sort.split(',').join()
		queryCommand = queryCommand.sort(sortBy)
	}

	// fields limiting
	if (req.query.fields) {
		const fields = req.query.fields.split(',').join(' ')
		queryCommand = queryCommand.select(fields)
	}

	// pagination
	// limit: số object lấy về 1 lần gọi API
	// skip: 2
	// 1 2 3 ... 10
	// +2 => 2
	// +dasdads => NaN
	const page = +req.query.page || 1
	const limit = +req.query.limit || process.env.LIMIT_PRODUCTS
	const skip = (page - 1) * limit
	queryCommand.skip(skip).limit(limit)

	// execute query
	// số lượng sp thỏa mãn điều kiện !== số lượng sản phẩm trả về 1 lần gọi API
	try {
		const response = await queryCommand.exec()
		const counts = await Product.find(query).countDocuments()

		return res.status(200).json({
			success: response ? true : false,
			counts,
			products: response ? response : "Can't get product",
		})
	} catch (err) {
		throw new Error(err.message)
	}
})

const updateProduct = asyncHandler(async (req, res) => {
	const { pid } = req.params
	const files = req?.files

	if (files?.thumb) req.body.thumb = files?.thumb[0]?.path
	if (files?.images) req.body.thumb = files?.images?.map(el => el.path)
	if (req.body && req.body.title) req.body.slug = slugify(req.body.title)

	const updateProduct = await Product.findByIdAndUpdate(pid, req.body, {
		new: true,
	})

	return res.status(200).json({
		success: updateProduct ? true : false,
		mes: updateProduct ? 'Updated' : "Can't update product",
	})
})

const deleteProduct = asyncHandler(async (req, res) => {
	const { pid } = req.params

	const deletedProduct = await Product.findByIdAndDelete(pid)

	return res.status(200).json({
		success: deletedProduct ? true : false,
		mes: deletedProduct ? 'Deleted' : "Can't delete product",
	})
})

const ratings = asyncHandler(async (req, res) => {
	const { _id } = req.user
	const { star, comment, pid, updatedAt } = req.body

	if (!star || !pid) throw new Error('Missing inputs')

	const ratingProduct = await Product.findById(pid)
	const alreadyRating = ratingProduct?.rating?.find(
		el => el.postedBy.toString() === _id,
	)

	if (alreadyRating) {
		// update star & comment
		await Product.updateOne(
			{
				rating: { $elemMatch: alreadyRating },
			},
			{
				$set: {
					'rating.$.star': star,
					'rating.$.comment': comment,
					'rating.$.updatedAt': updatedAt,
				},
			},
			{ new: true },
		)
	} else {
		// add star & comment
		await Product.findByIdAndUpdate(
			pid,
			{
				$push: { rating: { star, comment, postedBy: _id, updatedAt } },
			},
			{ new: true },
		)
	}

	// sum ratings
	const updatedProduct = await Product.findById(pid)
	const ratingCount = updatedProduct.rating.length
	const sumRatings = updatedProduct.rating.reduce((sum, el) => sum + el.star, 0)
	updatedProduct.totalRating = Math.round((sumRatings * 10) / ratingCount) / 10

	await updatedProduct.save()

	return res.status(200).json({
		success: true,
		updatedProduct,
	})
})

const uploadImagesProduct = asyncHandler(async (req, res) => {
	const { pid } = req.params

	if (!req.files) throw new Error('Missing inputs')

	const response = await Product.findByIdAndUpdate(
		pid,
		{
			$push: {
				images: { $each: req.files.map(el => el.path) },
			},
		},
		{ new: true },
	)

	return res.status(200).json({
		success: response ? true : false,
		updatedProduct: response ? response : "can't upload images product",
	})
})

const addVarriant = asyncHandler(async (req, res) => {
	const { pid } = req.params
	const { title, price, color } = req.body
	const thumb = req?.files?.thumb[0]?.path
	const images = req.files?.images?.map(el => el.path)
	if (!(title && price && color)) throw new Error('Missing inputs')

	const response = await Product.findByIdAndUpdate(
		pid,
		{
			$push: {
				varriants: {
					color,
					price,
					title,
					thumb,
					images,
					sku: makeSKU().toUpperCase(),
				},
			},
		},
		{ new: true },
	)

	return res.status(200).json({
		success: response ? true : false,
		mes: response ? 'Added varriant' : "can't add varriant",
	})
})

module.exports = {
	createProduct,
	getProduct,
	getProducts,
	updateProduct,
	deleteProduct,
	ratings,
	uploadImagesProduct,
	addVarriant,
}
