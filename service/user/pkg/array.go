package pkg

func Unique[T comparable](arr []T) []T {
	seen := make(map[T]struct{})
	result := make([]T, 0, len(arr))
	for _, v := range arr {
		if _, ok := seen[v]; ok {
			continue
		}
		seen[v] = struct{}{}
		result = append(result, v)
	}
	return result
}
