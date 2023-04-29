import { reactive, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSnackbar } from 'vue3-snackbar'
import { debounce } from '../helpers'
import router, { useParams } from '../router'
import { useApplicationStore } from '../store/application'
import { Category, Item } from '../../../node_modules/.prisma/client/index'
import { useModal } from 'vue-final-modal'
import ModalConfirm from '../components/ModalConfirm.vue'

export interface EditOptions {
    data?: Category | Item
    isItem?: boolean
}

export default function useEdit(options: EditOptions = {}) {

    const NO_TITLE = 'Введите название'
    const NO_DESCRIPTION = 'Введите описание'

    const { data, isItem } = options

    interface EditState {
        title: string
        description?: string
        price?: string | number
        image: string
        imageFile: null | File
        created: boolean
    }

    const state = reactive<EditState>({
        title: data?.title || NO_TITLE,
        description: data && 'description' in data && data.description !== undefined ? data.description : NO_DESCRIPTION,
        price: data && 'price' in data && data.price !== undefined ? data.price : undefined,
        image: data?.image ? data.image : '',
        imageFile: null,
        created: !!data?.id
    })

    const application = useApplicationStore()

    const snackbar = useSnackbar()
    const route = useRoute()
    const routeParams = useParams()
    const categoryId = ref(!isItem && data?.id || route.query.category || null)
    const functions = {
        category: {
            create: application.createCategory,
            update: application.updateCategory,
            delete: application.deleteCategory
        },
        item: {
            create: application.createItem,
            update: application.updateItem,
            delete: application.deleteItem
        }
    }

    const _fn = isItem ? functions.item : functions.category
    const ID = ref(isItem ? data?.id : categoryId.value)

    function handleDelete() {
        const { open: openDeleteModal, close: closeDeleteModal } = useModal({
            component: ModalConfirm,
            attrs: {
              title: 'Удаление',
              onClose() {
                closeDeleteModal()
              },
              async onConfirm() {
                await doDelete()
                closeDeleteModal()
              },
            },
            slots: {
              default: '<p>Подтверждаете удаление?</p>',
            },
        })

        openDeleteModal()
    }

    function handleFocus(item: keyof EditState) {
        if (!state[item] === undefined) return

        switch (item) {
            case 'title':
                if (state.title === NO_TITLE) state.title = ''
                break;
            case 'description':
                if (state.description === NO_DESCRIPTION) state.description = ''
                break;
            case 'price':
                if (state.price == 0) state.price = ''
                break;
        
            default:
                break;
        }
    }

    function handleBlur(item: keyof EditState) {
        if (state[item] === undefined) return

        switch (item) {
            case 'title':
                if (!state.title) state.title = NO_TITLE
                break;
            case 'description':
                if (!state.description) state.description = NO_DESCRIPTION
                break;
            case 'price':
                if (!state.price) state.price = 0
                break;
        
            default:
                break;
        }
    }

    const changesSaved = () => snackbar.add({
        type: 'info',
        text: 'Изменения сохранены!'
    })

    const changesNotSaved = () => snackbar.add({
        type: 'error',
        text: 'Ошибка при сохранении изменений!'
    })

    function resetState() {
        state.title = NO_TITLE
        state.description = NO_DESCRIPTION
        state.price = 0
        state.image = ''
        state.imageFile = null
        state.created = false

        categoryId.value = null
        ID.value = null
    }

    async function doDelete() {
        if (state.created && ID.value) {
            try {
                const result = await _fn.delete(ID.value.toString())
                if (!('errors' in result)) {
                    changesSaved()
                    if (!isItem) {
                        resetState()
                        if (route.name === 'Edit') router.push({ name: 'Edit' })
                    }
                } else {
                changesNotSaved()
                }
            } catch (ex) {
                changesNotSaved()
            }
        }
    }

    function handleImageChange(files: FileList) {
        const [image] = files

        if (image) {
            state.imageFile = image

            const reader = new FileReader()
            reader.onload = async () => {
                state.image = reader.result as string
                await saveChanges()
            }
            reader.readAsDataURL(image)
        }
    }

    const saveChanges = async () => {
        if ((!state.created && !state.imageFile) || (state.created && !categoryId.value)) return

        try {
            const formData = new FormData()
            formData.append('title', state.title)
            if (isItem) {
                if (categoryId.value) formData.append('categoryId', categoryId.value.toString())
                if (state.description) formData.append('description', state.description)
                if (state.price) formData.append('price', state.price.toString())
            }
            if (state.imageFile) {
                formData.append('image', state.imageFile)
            }

            const result = ID.value ? await _fn.update(ID.value.toString(), formData) : await _fn.create(formData)
            let changePage = false
            if ('id' in result && typeof result.id === 'number' && !ID.value) {
                ID.value = result.id
                if (!isItem) categoryId.value = result.id
                state.created = true
                if (route.name === 'Edit') changePage = true
            }
            if (state.imageFile) state.imageFile = null
            changesSaved()
            if (!isItem && changePage) router.push({ name: 'Edit', query: { category: categoryId.value } })
        } catch (ex) {
            changesNotSaved()
        }
    }

    const debounceInput = debounce(async (args: any[]) => {
        const [text, item] = args
        if (state[item as keyof EditState] !== undefined && state[item as keyof EditState] !== text) {
            (state[item as keyof EditState] as any) = text
            await saveChanges()
        }
    }, 1800)

    const directInput = (...args: any[]) => {
        const [text, item] = args
        if (state[item as keyof EditState] !== undefined && state[item as keyof EditState] !== text) {
            (state[item as keyof EditState] as any) = text
        }
    }

    const handleInput = (...args: any[]) => (!state.created && !state.imageFile) || (state.created && !categoryId.value) ? directInput(...args) : debounceInput(...args)

    async function fetchCategory() {
        if (!categoryId.value) return

        try {
            const category = await application.getCategory(categoryId.value.toString())
            if (!category) {
                snackbar.add({
                    type: 'error',
                    text: `Не найдено категории с ID ${categoryId.value}`
                })
                categoryId.value = null
            } else {
                state.image = category.image
                state.title = category.title
                state.created = true
            }
        } catch (ex: any) {
            snackbar.add({
                type: 'error',
                text: ex.message
            })
        }
    }

    if (!data) {
        const unwatch = watch(() => (routeParams as any).category, fetchCategory)

        onMounted(fetchCategory)
        onUnmounted(unwatch)
    }

    return {
        state,
        categoryId,
        handleFocus,
        handleBlur,
        handleImageChange,
        handleInput,
        handleDelete
    }
}