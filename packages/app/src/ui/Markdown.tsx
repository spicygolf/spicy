import { useMemo } from "react";
import { View } from "react-native";
import {
  type MarkdownNode,
  parseMarkdownWithOptions,
} from "react-native-nitro-markdown";
import { StyleSheet } from "react-native-unistyles";
import { Link } from "./Link";
import { Text } from "./Text";

interface MarkdownProps {
  children: string;
}

export function Markdown({ children }: MarkdownProps) {
  const ast = useMemo(
    () => parseMarkdownWithOptions(children, { gfm: true }),
    [children],
  );
  return <MarkdownRenderer node={ast} />;
}

interface RendererProps {
  node: MarkdownNode;
  listContext?: {
    ordered: boolean;
    start: number;
  };
  listIndex?: number;
}

function MarkdownRenderer({ node, listContext, listIndex }: RendererProps) {
  const renderChildren = (
    children: MarkdownNode[] | undefined,
    childListContext?: RendererProps["listContext"],
  ) =>
    children?.map((child, i) => (
      <MarkdownRenderer
        // biome-ignore lint/suspicious/noArrayIndexKey: AST nodes don't have stable IDs
        key={i}
        node={child}
        listContext={childListContext}
        listIndex={childListContext ? i : undefined}
      />
    ));

  switch (node.type) {
    case "document":
      return <View>{renderChildren(node.children)}</View>;

    case "heading": {
      const headingStyle = getHeadingStyle(node.level);
      return <Text style={headingStyle}>{renderChildren(node.children)}</Text>;
    }

    case "paragraph":
      return (
        <Text style={styles.paragraph}>{renderChildren(node.children)}</Text>
      );

    case "text":
      return <Text>{node.content}</Text>;

    case "bold":
      return <Text style={styles.bold}>{renderChildren(node.children)}</Text>;

    case "italic":
      return <Text style={styles.italic}>{renderChildren(node.children)}</Text>;

    case "strikethrough":
      return (
        <Text style={styles.strikethrough}>
          {renderChildren(node.children)}
        </Text>
      );

    case "link":
      if (!node.href) {
        return (
          <Text style={styles.linkText}>{renderChildren(node.children)}</Text>
        );
      }
      return (
        <Link href={{ url: node.href }} style={styles.link}>
          <Text style={styles.linkText}>{renderChildren(node.children)}</Text>
        </Link>
      );

    case "soft_break":
      return <Text> </Text>;

    case "line_break":
      return <Text>{"\n"}</Text>;

    case "code_inline":
      return <Text style={styles.codeInline}>{node.content}</Text>;

    case "code_block":
      return (
        <View style={styles.codeBlock}>
          <Text style={styles.codeBlockText}>{node.content}</Text>
        </View>
      );

    case "blockquote":
      return (
        <View style={styles.blockquote}>{renderChildren(node.children)}</View>
      );

    case "list": {
      const context = {
        ordered: node.ordered ?? false,
        start: node.start ?? 1,
      };
      return (
        <View style={styles.list}>
          {renderChildren(node.children, context)}
        </View>
      );
    }

    case "list_item": {
      const marker =
        listContext?.ordered && listIndex !== undefined
          ? `${listContext.start + listIndex}.`
          : "•";
      return (
        <View style={styles.listItem}>
          <Text style={styles.listBullet}>{marker}</Text>
          <Text style={styles.listItemContent}>
            {renderChildren(node.children)}
          </Text>
        </View>
      );
    }

    case "task_list_item":
      return (
        <View style={styles.listItem}>
          <Text style={styles.listBullet}>{node.checked ? "☑" : "☐"}</Text>
          <Text style={styles.listItemContent}>
            {renderChildren(node.children)}
          </Text>
        </View>
      );

    case "table":
      return <View style={styles.table}>{renderChildren(node.children)}</View>;

    case "table_head":
      return (
        <View style={styles.tableHead}>{renderChildren(node.children)}</View>
      );

    case "table_body":
      return <View>{renderChildren(node.children)}</View>;

    case "table_row":
      return (
        <View style={styles.tableRow}>{renderChildren(node.children)}</View>
      );

    case "table_cell":
      return (
        <View
          style={[styles.tableCell, node.isHeader && styles.tableHeaderCell]}
        >
          <Text style={node.isHeader ? styles.tableHeaderText : undefined}>
            {renderChildren(node.children)}
          </Text>
        </View>
      );

    default:
      if (node.children) {
        return <>{renderChildren(node.children)}</>;
      }
      return null;
  }
}

function getHeadingStyle(level: number | undefined) {
  switch (level) {
    case 1:
      return styles.h1;
    case 2:
      return styles.h2;
    case 3:
      return styles.h3;
    case 4:
      return styles.h4;
    case 5:
      return styles.h5;
    case 6:
      return styles.h6;
    default:
      return styles.h1;
  }
}

const styles = StyleSheet.create((theme) => ({
  h1: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: theme.gap(1),
    color: theme.colors.primary,
  },
  h2: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: theme.gap(1),
    color: theme.colors.primary,
  },
  h3: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: theme.gap(0.5),
    color: theme.colors.primary,
  },
  h4: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: theme.gap(0.5),
    color: theme.colors.primary,
  },
  h5: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: theme.gap(0.5),
    color: theme.colors.primary,
  },
  h6: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: theme.gap(0.5),
    color: theme.colors.primary,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: theme.gap(1),
    color: theme.colors.primary,
  },
  bold: {
    fontWeight: "bold",
  },
  italic: {
    fontStyle: "italic",
  },
  strikethrough: {
    textDecorationLine: "line-through",
  },
  link: {},
  linkText: {
    color: theme.colors.action,
    textDecorationLine: "underline",
  },
  codeInline: {
    fontFamily: "monospace",
    backgroundColor: theme.colors.border,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  codeBlock: {
    backgroundColor: theme.colors.border,
    padding: theme.gap(1),
    borderRadius: 8,
    marginBottom: theme.gap(1),
  },
  codeBlockText: {
    fontFamily: "monospace",
    fontSize: 12,
    color: theme.colors.primary,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.action,
    paddingLeft: theme.gap(1),
    marginLeft: theme.gap(0.5),
    marginBottom: theme.gap(1),
  },
  list: {
    marginBottom: theme.gap(1),
  },
  listItem: {
    flexDirection: "row",
    marginBottom: theme.gap(0.5),
  },
  listBullet: {
    minWidth: 20,
    color: theme.colors.primary,
  },
  listItemContent: {
    flex: 1,
  },
  table: {
    marginBottom: theme.gap(1),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHead: {
    backgroundColor: theme.colors.border,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tableCell: {
    flex: 1,
    padding: theme.gap(0.5),
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
  },
  tableHeaderCell: {
    backgroundColor: theme.colors.border,
  },
  tableHeaderText: {
    fontWeight: "bold",
  },
}));
