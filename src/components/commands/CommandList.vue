<template>
  <v-data-iterator
    :items="commandList"
    :items-per-page.sync="itemsPerPage"
    :page.sync="page"
    :search="search"
    :sort-by="sortBy.toLowerCase()"
    :sort-desc="sortDesc"
    hide-default-footer
  >
    <template v-slot:header>
      <v-toolbar>
        <v-text-field
          v-model="search"
          clearable
          flat
          hide-details
          prepend-inner-icon="mdi-magnify"
          label="Filter"
        ></v-text-field>
      </v-toolbar>
    </template>

    <template v-slot:default="props">
      <v-simple-table>
        <tbody>
          <tr v-for="item in props.items" :key="item.key">
            <td>{{ item.key }}</td>
          </tr>
        </tbody>
      </v-simple-table>
    </template>

    <template v-slot:footer>
      <!--v-row class="mt-2" align="center" justify="center"-->
      <v-toolbar dense>
        <!--span class="grey--text">Items per page</span>
        <v-menu offset-y>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              dark
              text
              color="primary"
              class="ml-2"
              v-bind="attrs"
              v-on="on"
            >
              {{ itemsPerPage }}
              <v-icon>mdi-chevron-down</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item
              v-for="(number, index) in itemsPerPageArray"
              :key="index"
              @click="updateItemsPerPage(number)"
            >
              <v-list-item-title>{{ number }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu-->

        <v-spacer></v-spacer>

        <span class="mr-4 grey--text">
          Page {{ page }} of {{ numberOfPages }}
        </span>
        <v-btn @click="formerPage">
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
        <v-btn @click="nextPage">
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </v-toolbar>
      <!--/v-row-->
    </template>
  </v-data-iterator>
</template>

<script>
export default {
  props: {
    value: {},
  },
  computed: {
    commandList() {
      return Object.keys(this.value)
        .filter((key) => key != "imports")
        .map((key) => ({
          ...this.value[key],
          key,
        }));
    },
    numberOfPages() {
      return Math.ceil(this.commandList.length / this.itemsPerPage);
    },
    filteredKeys() {
      return this.keys.filter((key) => key !== "Name");
    },
  },
  data() {
    return {
      itemsPerPageArray: [4, 8, 12],
      search: "",
      filter: {},
      sortDesc: false,
      page: 1,
      itemsPerPage: 4,
      sortBy: "name",
    };
  },
  methods: {
    nextPage() {
      if (this.page + 1 <= this.numberOfPages) this.page += 1;
    },
    formerPage() {
      if (this.page - 1 >= 1) this.page -= 1;
    },
    updateItemsPerPage(number) {
      this.itemsPerPage = number;
    },
  },
};
</script>

<style>
</style>