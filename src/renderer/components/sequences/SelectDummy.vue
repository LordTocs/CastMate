<template>
    <p class="select-dummy" ref="dummy">...</p>
</template>

<script>
// This monument to HTML mediocrity forces the DOM to select invisible text.
// The oncopy event will only fire if there's a selection to copy, so if we want to copy
// some non-text data structures like in the SequenceEditor we need to secretly select
// some text in the dom so the oncopy event fires when Ctrl+C is pressed.

export default {
    methods: {
        select() {
            const range = document.createRange();
            range.selectNodeContents(this.$refs.dummy);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        } 
    }
}
</script>

<style scoped>
    .select-dummy {
        font-size: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
    }
</style>